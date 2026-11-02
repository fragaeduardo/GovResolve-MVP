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
    assert topic["answer_filled_slots"] == ["logradouro", "bairro", "referencia"]
    assert "Tem um buraco grande na rua" not in recent_context
    assert SessionStore.load(session_id).topic_summary == "Tem um buraco grande na rua"


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
