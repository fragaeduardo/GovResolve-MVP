import pytest
import uuid

from src.ai.agents.department_routing_agent import DepartmentRoutingAgent
from src.ai.agents.conversational_agent import ConversationalAgent
from src.ai.agents.session_store import AgentSession
from src.ai.agents.state_collector import DeterministicStateCollector
from src.ai.service import AIScreeningService
from src.config import settings


@pytest.mark.asyncio
async def test_router_selects_only_a_registered_department(monkeypatch):
    monkeypatch.setattr(settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")

    result = await DepartmentRoutingAgent.route(
        "Tem um buraco enorme na rua", [{"name": "SEINFRA — Secretaria Municipal de Infraestrutura Urbana", "description": ""}]
    )

    assert result["department_name"].startswith("SEINFRA")


@pytest.mark.asyncio
async def test_router_asks_before_routing_ambiguous_words():
    result = await DepartmentRoutingAgent.route("O sinal está quebrado")
    assert "clarification" in result


@pytest.mark.asyncio
async def test_transbording_drain_routes_by_water_type(monkeypatch):
    monkeypatch.setattr(settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")

    rain = await DepartmentRoutingAgent.route("O bueiro está transbordando. É água da chuva")
    sewage = await DepartmentRoutingAgent.route("O bueiro está transbordando com esgoto")

    assert rain["department_name"].startswith("SEINFRA")
    assert sewage["department_name"].startswith("SANEAGO")


@pytest.mark.asyncio
async def test_router_distinguishes_tree_pruning_from_environmental_crime(monkeypatch):
    monkeypatch.setattr(settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")

    pruning = await DepartmentRoutingAgent.route("Uma árvore caiu na praça")
    requested_pruning = await DepartmentRoutingAgent.route("Preciso de poda de árvore na calçada")
    crime = await DepartmentRoutingAgent.route("Estão cortando árvores ilegalmente")

    assert pruning["department_name"].startswith("COMURG")
    assert requested_pruning["department_name"].startswith("AMMA")
    assert crime["department_name"].startswith("AMMA")


@pytest.mark.asyncio
async def test_address_answer_does_not_switch_the_complaint_department(monkeypatch):
    from src.ai.agents.planner import Planner

    monkeypatch.setattr(settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
    session_id = f"routing_location_answer_{uuid.uuid4()}"
    conversation = [{"role": "user", "content": "Uma árvore caiu na praça"}]
    first = await Planner.process_turn(conversation, session_id)
    conversation += [
        {"role": "assistant", "content": first["reply"]},
        {"role": "user", "content": "Na Avenida 85, no Setor Marista, perto da Escola Municipal"}
    ]

    result = await Planner.process_turn(conversation, session_id)

    assert result["department_name"].startswith("COMURG")
    assert result["proposal"]["slots"]["logradouro"] == "Avenida 85"


@pytest.mark.asyncio
async def test_named_public_place_counts_as_location(monkeypatch):
    from src.ai.agents.planner import Planner

    monkeypatch.setattr(settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
    session_id = f"routing_named_place_{uuid.uuid4()}"
    conversation = [{"role": "user", "content": "A lâmpada do poste apagou na praça"}]
    first = await Planner.process_turn(conversation, session_id)
    conversation += [
        {"role": "assistant", "content": first["reply"]},
        {"role": "user", "content": "Praça Universitária, no Setor Universitário, perto da UFG"}
    ]

    result = await Planner.process_turn(conversation, session_id)

    assert result["department_name"].startswith("SEINFRA")
    assert result["proposal"]["slots"]["logradouro"] == "Praça Universitária"


@pytest.mark.asyncio
async def test_cross_street_address_stops_at_first_street_name(monkeypatch):
    from src.ai.agents.planner import Planner

    monkeypatch.setattr(settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
    session_id = f"routing_crossing_{uuid.uuid4()}"
    conversation = [{
        "role": "user",
        "content": "O semáforo apagou no cruzamento da Avenida Goiás com a Rua 4, no Centro"
    }]

    result = await Planner.process_turn(conversation, session_id)

    assert result["department_name"].startswith("SET")
    assert result["proposal"]["slots"]["logradouro"] == "Avenida Goiás"


def test_collector_does_not_treat_complaint_continuation_as_street():
    session = AgentSession(messages=[{
        "role": "user",
        "content": "Tem um buraco enorme na rua e os carros estão desviando"
    }])

    DeterministicStateCollector.collect(session)

    assert "logradouro" not in session.collected_slots


def test_collector_repairs_old_bad_address_and_preserves_casing():
    session = AgentSession(
        messages=[{"role": "user", "content": "Rua Goiás, no Setor Bueno"}],
        collected_slots={"logradouro": "Rua E Os Carros Estão"}
    )

    DeterministicStateCollector.collect(session)

    assert session.collected_slots["logradouro"] == "Rua Goiás"
    assert session.collected_slots["bairro"] == "Setor Bueno"


@pytest.mark.asyncio
async def test_conversational_agent_drops_unwanted_recap(monkeypatch):
    async def canned_echo(cls, messages, response_json=False):
        return "Entendi o relato: Tem um buraco enorme na rua e os carros estão desviando. Onde aconteceu?"

    monkeypatch.setattr(AIScreeningService, "call_llm_with_fallback", classmethod(canned_echo))
    session = AgentSession(problem_type="buraco_asfalto")
    complaint = "Tem um buraco enorme na rua e os carros estão desviando"

    reply = await ConversationalAgent.generate_next_question(session, complaint, ["logradouro", "bairro", "referencia"])

    assert "Entendi" not in reply
    assert complaint not in reply
    assert reply == "Onde fica o buraco? Diga a rua ou um lugar conhecido, o bairro e um número ou ponto de referência."
