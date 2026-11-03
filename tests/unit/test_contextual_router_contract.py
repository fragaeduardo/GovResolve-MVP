import json
from unittest.mock import AsyncMock

import pytest

from src.ai.agents.department_routing_agent import DepartmentRoutingAgent
from src.ai.service import AIScreeningService


@pytest.mark.asyncio
@pytest.mark.parametrize('answer', ['[]', 'null', 'invalido', '{"intent":"PUBLIC_COMPLAINT","confidence":"nan","department_code":"SEINFRA"}', '{"intent":"PUBLIC_COMPLAINT","confidence":0.5,"department_code":"SEINFRA"}', '{"intent":"PUBLIC_COMPLAINT","confidence":1,"department_code":"INVENTADO"}'])
async def test_invalid_or_untrusted_destination_requires_clarification(monkeypatch, answer):
    monkeypatch.setattr(AIScreeningService, 'call_llm_with_fallback', AsyncMock(return_value=answer))
    result = await DepartmentRoutingAgent.route('Relato para encaminhamento', intent_only=False)
    assert result['intent'] == 'UNCLEAR'
    assert 'department' not in result


@pytest.mark.asyncio
async def test_department_is_selected_only_after_intake(monkeypatch):
    monkeypatch.setattr(AIScreeningService, 'call_llm_with_fallback', AsyncMock(return_value=json.dumps({'intent':'PUBLIC_COMPLAINT','confidence':0.95,'department_code':'SEINFRA'})))
    initial = await DepartmentRoutingAgent.route('Relato do cidadão', intent_only=True)
    assert initial == {'intent':'PUBLIC_COMPLAINT'}
    final = await DepartmentRoutingAgent.route('Ficha completa do cidadão', intent_only=False)
    assert final['department']['code'] == 'SEINFRA'
    filtered = await DepartmentRoutingAgent.route('Ficha completa', [{'name':'Órgão não cadastrado'}], intent_only=False)
    assert filtered['intent'] == 'UNCLEAR'


@pytest.mark.asyncio
async def test_router_recognizes_topic_switch_and_clear_incomplete_complaints(monkeypatch):
    prompts = []

    async def fake_model(cls, messages, response_json=True):
        prompts.append(messages[0]["content"])
        return json.dumps({"intent": "TOPIC_SWITCH", "confidence": 0.95})

    monkeypatch.setattr(AIScreeningService, "call_llm_with_fallback", classmethod(fake_model))
    result = await DepartmentRoutingAgent.route(
        "Na verdade, esquece o buraco. Uma árvore caiu na praça.",
        intent_only=True,
        previous_topic={"summary": "buraco no asfalto", "pending_slots": ["logradouro"]},
    )

    assert result == {"intent": "TOPIC_SWITCH"}
    assert "falta de localização" in prompts[0]
    assert "TOPIC_SWITCH" in prompts[0]


@pytest.mark.asyncio
async def test_self_service_link_comes_from_catalog_not_the_model(monkeypatch):
    monkeypatch.setattr(AIScreeningService, 'call_llm_with_fallback', AsyncMock(return_value=json.dumps({'intent':'SELF_SERVICE','confidence':0.95,'service_code':'IPTU_2VIA','link':'https://example.invalid/inventado'})))
    result = await DepartmentRoutingAgent.route('Quero emitir a segunda via do IPTU')
    assert result['intent'] == 'SELF_SERVICE'
    assert result['service']['link'].startswith('https://tributos.goiania.go.gov.br/')


@pytest.mark.asyncio
async def test_generic_fee_cannot_be_misclassified_as_iptu_self_service(monkeypatch):
    monkeypatch.setattr(AIScreeningService, 'call_llm_with_fallback', AsyncMock(return_value=json.dumps({'intent':'SELF_SERVICE','confidence':0.95,'service_code':'IPTU_2VIA'})))
    result = await DepartmentRoutingAgent.route('Quero consultar o boleto de uma taxa municipal')
    assert result['intent'] == 'UNCLEAR'


@pytest.mark.asyncio
async def test_obvious_ambiguities_are_clarified_before_model_routing(monkeypatch):
    model = AsyncMock(return_value=json.dumps({'intent':'PUBLIC_COMPLAINT','confidence':0.95}))
    monkeypatch.setattr(AIScreeningService, 'call_llm_with_fallback', model)

    signal = await DepartmentRoutingAgent.route('O sinal está quebrado.')
    multiple = await DepartmentRoutingAgent.route('Minha rua está com lixo acumulado e vários buracos no asfalto.')
    leak = await DepartmentRoutingAgent.route('Tem um vazamento perto do poste.', intent_only=False)

    assert signal['intent'] == 'UNCLEAR' and 'semáforo' in signal['clarification']
    assert multiple['intent'] == 'UNCLEAR' and 'mais de um tipo' in multiple['clarification']
    assert leak['intent'] == 'UNCLEAR' and 'água, esgoto' in leak['clarification']
    model.assert_not_awaited()


@pytest.mark.asyncio
async def test_explicit_tree_pruning_and_school_staff_route_from_catalog(monkeypatch):
    model = AsyncMock(return_value=json.dumps({'intent':'PUBLIC_COMPLAINT','confidence':0.95,'department_code':'COMURG'}))
    monkeypatch.setattr(AIScreeningService, 'call_llm_with_fallback', model)

    pruning = await DepartmentRoutingAgent.route('Preciso solicitar poda de árvore na calçada.', intent_only=False)
    teacher = await DepartmentRoutingAgent.route('Um professor da escola municipal precisa de apoio.', intent_only=False)

    assert pruning['department']['code'] == 'AMMA'
    assert teacher['department']['code'] == 'SME'
    model.assert_not_awaited()


@pytest.mark.asyncio
async def test_explicit_catalog_topics_route_without_model_guessing(monkeypatch):
    model = AsyncMock(return_value=json.dumps({'intent':'PUBLIC_COMPLAINT','confidence':0.95,'department_code':'SEINFRA'}))
    monkeypatch.setattr(AIScreeningService, 'call_llm_with_fallback', model)

    signal = await DepartmentRoutingAgent.route('A sinalização da avenida está apagada.', intent_only=False)
    vandalism = await DepartmentRoutingAgent.route('Houve depredação de prédio público.', intent_only=False)
    debris = await DepartmentRoutingAgent.route('Há entulho no passeio público.', intent_only=False)

    assert signal['department']['code'] == 'SET'
    assert vandalism['department']['code'] == 'AGCM'
    assert debris['department']['code'] == 'COMURG'
    model.assert_not_awaited()
