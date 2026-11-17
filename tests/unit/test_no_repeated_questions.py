import json

import pytest

from src.ai.agents.conversational_agent import ConversationalAgent
from src.ai.agents.department_routing_agent import DepartmentRoutingAgent
from src.ai.agents.planner import Planner
from src.ai.agents.session_store import SessionStore, AgentSession
from src.ai.agents.state_collector import DeterministicStateCollector
from src.ai.service import AIScreeningService
from src.config import settings


@pytest.mark.parametrize(
    ("message", "expected_location", "expected_neighborhood"),
    [
        (
            "Praça Universitária, no Setor Universitário, perto da UFG",
            "Praça Universitária",
            "Setor Universitário",
        ),
        (
            "O problema fica no Parque Vaca Brava, no Setor Bueno, perto do portão principal",
            "Parque Vaca Brava",
            "Setor Bueno",
        ),
    ],
)
def test_collector_counts_named_public_places_as_locations(message, expected_location, expected_neighborhood):
    session = AgentSession(messages=[{"role": "user", "content": message}])

    DeterministicStateCollector.collect(session)

    assert session.collected_slots["logradouro"] == expected_location
    assert session.collected_slots["bairro"] == expected_neighborhood
    assert session.collected_slots["referencia"]


def test_named_park_does_not_satisfy_the_neighborhood_slot_by_itself():
    session = AgentSession(messages=[{
        "role": "user",
        "content": "O problema fica no Parque Vaca Brava, perto do portão principal",
    }])

    DeterministicStateCollector.collect(session)

    assert session.collected_slots["logradouro"] == "Parque Vaca Brava"
    assert "bairro" not in session.collected_slots


def test_reference_extraction_keeps_full_phrase_without_duplicate_number():
    session = AgentSession(messages=[{
        "role": "user",
        "content": "Em frente ao número 450",
    }])

    DeterministicStateCollector.collect(session)

    assert session.collected_slots["referencia"] == "Em frente ao número 450"


@pytest.mark.parametrize(
    ("message", "expected_location", "expected_neighborhood", "expected_number"),
    [
        ("Rua T-36, 450, Setor Bueno", "Rua T-36", "Setor Bueno", "450"),
        ("Avenida 85, 120, Setor Marista", "Avenida 85", "Setor Marista", "120"),
        ("Praça Universitária, 30, Setor Universitário", "Praça Universitária", "Setor Universitário", "30"),
    ],
)
def test_house_number_in_full_address_satisfies_reference_slot(
    message, expected_location, expected_neighborhood, expected_number
):
    session = AgentSession(
        messages=[{"role": "user", "content": message}],
        mandatory_slots=["logradouro", "bairro", "referencia"],
    )

    DeterministicStateCollector.collect(session)

    assert session.collected_slots["logradouro"] == expected_location
    assert session.collected_slots["bairro"] == expected_neighborhood
    assert session.collected_slots["referencia"] == f"Número {expected_number}"
    assert session.get_missing_mandatory_slots() == []


@pytest.mark.parametrize(
    ("collected", "missing", "forbidden_terms"),
    [
        ({"logradouro": "Rua T-36", "bairro": "Setor Bueno"}, ["referencia"], ["rua", "bairro"]),
        ({"bairro": "Setor Bueno", "referencia": "perto da UFG"}, ["logradouro"], ["bairro", "referencia"]),
        ({"referencia": "em frente ao 450"}, ["logradouro", "bairro"], ["ponto de referência"]),
    ],
)
def test_fallback_question_mentions_only_missing_fields(collected, missing, forbidden_terms):
    reply = ConversationalAgent._generate_expert_reply(
        AgentSession(problem_type="buraco_asfalto", collected_slots=collected),
        missing,
    ).casefold()

    assert all(term not in reply for term in forbidden_terms)


def test_reference_question_does_not_count_known_address_as_repeated():
    session = AgentSession(
        topic_identified=True,
        collected_slots={"logradouro": "Rua T-36", "bairro": "Setor Bueno"},
        mandatory_slots=["logradouro", "bairro", "referencia"],
    )
    reply = "Qual é o número ou um ponto de referência desse endereço?"

    assert not ConversationalAgent._asks_for_collected_slot(reply, session, ["referencia"], "Rua T-36, no Setor Bueno")
    assert ConversationalAgent._asks_for_collected_slot("Qual é o endereço completo?", session, ["referencia"], "Rua T-36, no Setor Bueno")


@pytest.mark.asyncio
async def test_local_omniroute_request_has_cold_start_timeout_and_output_limit(monkeypatch):
    seen = {}

    class Response:
        status_code = 200

        def json(self):
            return {"choices": [{"message": {"content": '{"ok":true}'}}]}

    class Client:
        def __init__(self, timeout):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, **kwargs):
            seen["url"] = url
            seen["timeout"] = kwargs.get("timeout")
            seen["payload"] = kwargs["json"]
            return Response()

    monkeypatch.setattr(settings, "AI_PROVIDER", "omniroute")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    monkeypatch.setattr(settings, "OMNIROUTE_API_KEY", "local-test-key")
    monkeypatch.setattr(settings, "OMNIROUTE_MODELS", "ollama-local/qwen3.5:4b")
    monkeypatch.setattr("src.ai.service.httpx.AsyncClient", Client)

    answer = await AIScreeningService.call_llm_with_fallback(
        [{"role": "user", "content": "Retorne {\\\"ok\\\":true}."}],
        response_json=True,
    )

    assert answer == '{"ok":true}'
    assert seen["url"] == "http://localhost:20128/v1/chat/completions"
    assert seen["timeout"] == 60.0
    assert seen["payload"]["max_tokens"] == 512
    assert seen["payload"]["reasoning_effort"] == "none"


@pytest.mark.asyncio
async def test_router_receives_topic_summary_and_pending_fields(monkeypatch):
    payloads = []

    async def model(cls, messages, response_json=False):
        payloads.append(json.loads(messages[-1]["content"]))
        return json.dumps({"intent": "CONTINUATION", "confidence": 0.96})

    monkeypatch.setattr(AIScreeningService, "call_llm_with_fallback", classmethod(model))
    previous_topic = {
        "summary": "Buraco na Rua T-36",
        "pending_slots": ["bairro", "referencia"],
        "collected_slots": {"logradouro": "Rua T-36"},
    }

    result = await DepartmentRoutingAgent.route(
        "Setor Bueno",
        previous_topic=previous_topic,
        conversation_context="assistant: Qual é o bairro?\nuser: Setor Bueno",
    )

    assert result == {"intent": "CONTINUATION"}
    assert payloads[0]["assunto_atual_da_sessao"] == previous_topic


@pytest.mark.asyncio
async def test_router_requests_and_returns_literal_location_fields(monkeypatch):
    captured = []
    fields = {
        "logradouro": "Tal Tal",
        "bairro": "XY",
        "referencias": ["na altura do 9472", "colado no mercado Central"],
    }

    async def model(cls, messages, response_json=False):
        captured.append(messages[0]["content"])
        return json.dumps({"intent": "PUBLIC_COMPLAINT", "confidence": 0.98, "location_fields": fields})

    monkeypatch.setattr(AIScreeningService, "call_llm_with_fallback", classmethod(model))

    result = await DepartmentRoutingAgent.route(
        "O trecho é Tal Tal, fica no XY, na altura do 9472, colado no mercado Central.",
    )

    assert result["location_fields"] == fields
    assert "trechos literais" in captured[0]
    assert "qualquer ordem" in captured[0]


@pytest.mark.asyncio
async def test_clarification_rewriter_receives_known_fields_and_cannot_repeat_them(monkeypatch):
    captured = []

    async def repeated_question(cls, messages, response_json=False):
        captured.append(json.loads(messages[-1]["content"]))
        return "Em qual rua e bairro aconteceu? Informe o endereço novamente."

    monkeypatch.setattr(AIScreeningService, "call_llm_with_fallback", classmethod(repeated_question))
    session = AgentSession(
        topic_identified=True,
        topic_summary="Buraco na via",
        problem_type="buraco_asfalto",
        collected_slots={"logradouro": "Rua T-36", "bairro": "Setor Bueno"},
        mandatory_slots=["logradouro", "bairro", "referencia"],
    )

    reply = await ConversationalAgent.generate_clarification(
        session,
        "Em frente ao número 450",
        "Qual rua fica o problema?",
    )

    assert captured[0]["campos_ja_coletados"] == {
        "logradouro": "Rua T-36",
        "bairro": "Setor Bueno",
    }
    assert captured[0]["campos_pendentes"] == ["referencia"]
    assert reply == "Qual é o número ou um ponto de referência desse endereço?"


@pytest.mark.asyncio
async def test_short_location_answer_survives_unclear_router_and_long_history(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "AGENT_MEMORY_DIR", str(tmp_path))
    router_contexts = []

    async def fake_route(
        cls,
        text,
        registered_departments=None,
        *,
        intent_only=True,
        previous_topic=None,
        conversation_context="",
    ):
        if not intent_only:
            return {
                "intent": "PUBLIC_COMPLAINT",
                "department": {
                    "code": "SEINFRA",
                    "name": "SEINFRA — Secretaria Municipal de Infraestrutura Urbana",
                },
                "category": "Buraco ou asfalto danificado",
                "problem_type": "buraco_asfalto",
            }
        if previous_topic is None:
            return {"intent": "PUBLIC_COMPLAINT"}
        router_contexts.append((previous_topic, conversation_context))
        # Simulate a classifier that misses a short reply even though it fills every field.
        return {"intent": "UNCLEAR", "clarification": "Pode informar o endereço?"}

    async def first_question(cls, session, last_user_input, missing_slots):
        return "Em qual rua fica o problema? Diga também o bairro e um ponto de referência."

    monkeypatch.setattr(DepartmentRoutingAgent, "route", classmethod(fake_route))
    monkeypatch.setattr(ConversationalAgent, "generate_next_question", classmethod(first_question))

    session_id = "repeat_question_long_history"
    first = await Planner.process_turn(
        [{"role": "user", "content": "Tem um buraco grande na rua"}],
        session_id=session_id,
    )
    assert first["ready_to_register"] is False

    saved = SessionStore.load(session_id)
    assert saved is not None
    saved.messages.extend(
        {"role": "assistant", "content": "Continuo aguardando os dados da localização."}
        for _ in range(8)
    )
    SessionStore.save(saved)

    result = await Planner.process_turn(
        [{"role": "user", "content": "Praça Universitária, no Setor Universitário, perto da UFG"}],
        session_id=session_id,
    )

    assert result["ready_to_register"] is True
    assert result["proposal"]["slots"]["logradouro"] == "Praça Universitária"
    assert result["proposal"]["slots"]["bairro"] == "Setor Universitário"
    assert "UFG" in result["proposal"]["slots"]["referencia"]
    assert set(result["proposal"]["changed_fields"] or []) >= {"logradouro", "bairro", "referencia"}
    assert len(router_contexts) == 1
    topic, recent_context = router_contexts[0]
    assert topic["summary"] == "Tem um buraco grande na rua"
    assert set(topic["pending_slots"]) == {"logradouro", "bairro", "referencia"}
    assert set(topic["collected_slots"]) == {"relato"}
    assert topic["collected_slots"]["relato"] == "Tem um buraco grande na rua"
    assert "Tem um buraco grande na rua" not in recent_context
    assert SessionStore.load(session_id).topic_summary == "Tem um buraco grande na rua"


@pytest.mark.asyncio
async def test_model_extraction_fills_unordered_address_and_landmark(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "AGENT_MEMORY_DIR", str(tmp_path))
    source = (
        "O trecho é Tal Tal, fica no XY, na altura do 9472, colado no mercado Central. "
        "O buraco se espalha pela pista e dificulta a passagem dos carros."
    )
    fields = {
        "logradouro": "Tal Tal",
        "bairro": "XY",
        "referencias": ["na altura do 9472", "colado no mercado Central", "em frente ao hospital"],
    }

    async def fake_route(
        cls, text, registered_departments=None, *, intent_only=True,
        previous_topic=None, conversation_context="",
    ):
        if not intent_only:
            return {
                "intent": "PUBLIC_COMPLAINT",
                "department": {
                    "code": "SEINFRA",
                    "name": "SEINFRA — Secretaria Municipal de Infraestrutura Urbana",
                },
                "category": "Buraco ou asfalto danificado",
                "problem_type": "buraco_asfalto",
            }
        if previous_topic is None:
            return {"intent": "PUBLIC_COMPLAINT"}
        return {"intent": "UNCLEAR", "location_fields": fields}

    monkeypatch.setattr(DepartmentRoutingAgent, "route", classmethod(fake_route))
    async def next_question(cls, session, last_user_input, missing_slots):
        return "Qual é a localização do problema?"

    monkeypatch.setattr(ConversationalAgent, "generate_next_question", classmethod(next_question))

    session_id = "unordered_model_address"
    await Planner.process_turn([{"role": "user", "content": "Tem um buraco na via."}], session_id)
    result = await Planner.process_turn([{"role": "user", "content": source}], session_id)

    assert result["ready_to_register"] is True
    slots = result["proposal"]["slots"]
    assert slots["logradouro"] == "Tal Tal"
    assert slots["bairro"] == "XY"
    assert "9472" in slots["referencia"]
    assert "mercado Central" in slots["referencia"]
    assert "hospital" not in slots["referencia"]


@pytest.mark.asyncio
async def test_topic_switch_resets_intake_and_keeps_old_report_out_of_proposal(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "AGENT_MEMORY_DIR", str(tmp_path))
    old_report = "Tem um buraco grande no asfalto."
    new_report = "Na verdade, esquece o buraco. Uma árvore caiu na Praça Cívica, no Setor Central, em frente ao coreto."

    async def fake_route(
        cls, text, registered_departments=None, *, intent_only=True,
        previous_topic=None, conversation_context="",
    ):
        if intent_only and previous_topic is None:
            return {"intent": "PUBLIC_COMPLAINT"}
        if intent_only:
            assert previous_topic["summary"] == old_report
            assert previous_topic["collected_slots"]["relato"] == old_report
            assert "logradouro" not in previous_topic["collected_slots"]
            return {"intent": "TOPIC_SWITCH"}
        sheet = json.loads(text)
        assert sheet["relato"] == [new_report]
        assert old_report not in json.dumps(sheet, ensure_ascii=False)
        return {
            "intent": "PUBLIC_COMPLAINT",
            "department": {"code": "COMURG", "name": "COMURG — Companhia de Urbanização"},
            "category": "Árvore caída",
            "problem_type": "limpeza_entulho_poda",
        }

    async def next_question(cls, session, last_user_input, missing_slots):
        return "Qual é a rua, o bairro e um ponto de referência?"

    monkeypatch.setattr(DepartmentRoutingAgent, "route", classmethod(fake_route))
    monkeypatch.setattr(ConversationalAgent, "generate_next_question", classmethod(next_question))

    session_id = "topic_switch_memory"
    first = await Planner.process_turn([{"role": "user", "content": old_report}], session_id)
    saved = SessionStore.load(session_id)
    saved.proposal_id = "proposal_old_topic"
    saved.proposal_version = 4
    saved.current_proposal = {"id": "proposal_old_topic", "description": old_report}
    saved.self_service_link = "https://example.invalid/stale"
    saved.self_service_instructions = "stale service instructions"
    SessionStore.save(saved)
    result = await Planner.process_turn(
        [{"role": "assistant", "content": first["reply"]}, {"role": "user", "content": new_report}],
        session_id,
    )
    saved = SessionStore.load(session_id)

    assert result["ready_to_register"] is True
    assert result["department_name"].startswith("COMURG")
    assert saved.topic_summary == new_report
    assert saved.get_topic_user_messages() == [new_report]
    assert old_report not in saved.collected_slots["relato"]
    assert old_report not in result["suggested_description"]
    assert saved.proposal_id != "proposal_old_topic"
    assert saved.proposal_version == 1
    assert saved.self_service_link is None and saved.self_service_instructions is None


@pytest.mark.asyncio
async def test_generated_question_is_replaced_if_it_repeats_collected_location(monkeypatch):
    async def repeated_question(cls, messages, response_json=False):
        return "Em qual rua e bairro fica? Informe novamente o endereço completo."

    monkeypatch.setattr(AIScreeningService, "call_llm_with_fallback", classmethod(repeated_question))
    session = AgentSession(
        topic_identified=True,
        topic_summary="Buraco na via",
        problem_type="buraco_asfalto",
        collected_slots={"logradouro": "Rua T-36", "bairro": "Setor Bueno"},
    )

    reply = await ConversationalAgent.generate_next_question(
        session,
        "Rua T-36, no Setor Bueno",
        ["referencia"],
    )

    assert reply == "Qual é o número ou um ponto de referência desse endereço?"


@pytest.mark.asyncio
async def test_generated_question_is_replaced_if_it_ignores_missing_fields(monkeypatch):
    async def vague_question(cls, messages, response_json=False):
        return "Pode contar mais sobre isso?"

    monkeypatch.setattr(AIScreeningService, "call_llm_with_fallback", classmethod(vague_question))
    session = AgentSession(
        topic_identified=True,
        topic_summary="Buraco na via",
        problem_type="buraco_asfalto",
        collected_slots={"logradouro": "Rua T-36", "bairro": "Setor Bueno"},
    )

    reply = await ConversationalAgent.generate_next_question(
        session,
        "Rua T-36, no Setor Bueno",
        ["referencia"],
    )

    assert reply == "Qual é o número ou um ponto de referência desse endereço?"
