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
async def test_self_service_link_comes_from_catalog_not_the_model(monkeypatch):
    monkeypatch.setattr(AIScreeningService, 'call_llm_with_fallback', AsyncMock(return_value=json.dumps({'intent':'SELF_SERVICE','confidence':0.95,'service_code':'IPTU_2VIA','link':'https://example.invalid/inventado'})))
    result = await DepartmentRoutingAgent.route('Pedido de orientação')
    assert result['intent'] == 'SELF_SERVICE'
    assert result['service']['link'].startswith('https://tributos.goiania.go.gov.br/')
