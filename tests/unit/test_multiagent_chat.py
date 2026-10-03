import pytest
from src.ai.agents.orchestrator import MultiAgentOrchestrator
from src.ai.agents.session_store import SessionStore
from src.db.schema import ServiceType


@pytest.mark.asyncio
async def test_multiagent_greeting_turn():
    """Cidadão manda apenas 'Oi' -> Agente acolhe sem inventar protocolos."""
    conv = [{"role": "user", "content": "Olá, boa tarde!"}]
    res = await MultiAgentOrchestrator.process_turn(conv)
    assert res["ready_to_register"] is False
    assert "como posso ajudar" in res["reply"].lower() or "olá" in res["reply"].lower()
    assert res["session_id"] is not None


@pytest.mark.asyncio
async def test_multiagent_multi_turn_buraco_flow():
    """
    Fluxo multi-turn completo exigido pelo usuário:
    1. 'To com um buraco na rua' -> Não fecha prematuramente! Pede localização exata.
    2. 'É na Rua T-36 no Setor Bueno' -> Extrai rua e bairro, pede ponto de referência/número.
    3. 'Em frente ao nº 450' -> Todos os slots coletados! Confirmação Human-in-the-Loop.
    """
    # Turno 1: Notificação do problema
    conv1 = [{"role": "user", "content": "To com um buraco na rua"}]
    res1 = await MultiAgentOrchestrator.process_turn(conv1)
    session_id = res1["session_id"]
    
    assert res1["ready_to_register"] is False
    assert "SEINFRA" in res1["department_name"]
    # Não deve ter dado como pronto
    assert "endereço" in res1["reply"].lower() or "rua" in res1["reply"].lower() or "localização" in res1["reply"].lower()

    # Turno 2: Cidadão informa a rua e bairro
    conv2 = [
        {"role": "user", "content": "To com um buraco na rua"},
        {"role": "assistant", "content": res1["reply"]},
        {"role": "user", "content": "É na Rua T-36, no Setor Bueno"}
    ]
    res2 = await MultiAgentOrchestrator.process_turn(conv2, session_id=session_id)
    assert res2["ready_to_register"] is False
    assert "referência" in res2["reply"].lower() or "número" in res2["reply"].lower() or "ponto" in res2["reply"].lower()

    # Turno 3: Cidadão informa o ponto de referência / número
    conv3 = conv2 + [
        {"role": "assistant", "content": res2["reply"]},
        {"role": "user", "content": "Em frente ao número 450, ao lado do mercado"}
    ]
    res3 = await MultiAgentOrchestrator.process_turn(conv3, session_id=session_id)
    assert res3["ready_to_register"] is True
    assert "SEINFRA" in res3["department_name"]
    assert "Rua T-36" in res3["suggested_description"]
    assert "Setor Bueno" in res3["suggested_description"]
    assert "450" in res3["suggested_description"]
    assert "Confirmar e Gerar Protocolo" in res3["reply"]

    # Verificar persistência em disco
    saved_session = SessionStore.load(session_id)
    assert saved_session is not None
    assert saved_session.collected_slots["logradouro"] == "Rua T-36"
    assert saved_session.collected_slots["bairro"] == "Setor Bueno"


@pytest.mark.asyncio
async def test_multiagent_self_service_detection():
    """Identifica autoatendimento de IPTU e fornece link oficial sem abrir chamado de zeladoria."""
    conv = [{"role": "user", "content": "Quero tirar a 2 via do IPTU que venceu"}]
    res = await MultiAgentOrchestrator.process_turn(conv)
    assert res["ready_to_register"] is False
    assert res["service_type"] == ServiceType.AUTOATENDIMENTO
    assert "SEFIN" in res["department_name"]
    assert res["self_service_link"] is not None
    assert "iptu" in res["self_service_link"]


@pytest.mark.asyncio
async def test_multiagent_dynamic_topic_switching():
    """Valida troca dinâmica de tópicos na mesma sessão sem travar no órgão anterior."""
    session_id = "test_switching_session_xyz"

    # Turno 1: Buraco na rua -> SEINFRA
    res1 = await MultiAgentOrchestrator.process_turn(
        [{"role": "user", "content": "Buraco ou asfalto danificado na rua"}],
        session_id=session_id
    )
    assert "SEINFRA" in res1["department_name"]
    assert "SEINFRA" in res1["reply"] or "asfalto" in res1["reply"] or "rua" in res1["reply"]

    # Turno 2: Cidadão muda para lixo acumulado ou poda de árvores -> COMURG (NÃO SEINFRA!)
    res2 = await MultiAgentOrchestrator.process_turn(
        [
            {"role": "user", "content": "Buraco ou asfalto danificado na rua"},
            {"role": "assistant", "content": res1["reply"]},
            {"role": "user", "content": "Lixo acumulado ou poda de árvores"}
        ],
        session_id=session_id
    )
    assert "COMURG" in res2["department_name"]
    assert "COMURG" in res2["reply"] or "lixo" in res2["reply"].lower() or "árvore" in res2["reply"].lower()

    # Turno 3: Cidadão muda para posto de saúde ou remédio -> SMS (NÃO COMURG NEM SEINFRA!)
    res3 = await MultiAgentOrchestrator.process_turn(
        [
            {"role": "user", "content": "Lixo acumulado ou poda de árvores"},
            {"role": "assistant", "content": res2["reply"]},
            {"role": "user", "content": "Falta de remédio ou posto de saúde"}
        ],
        session_id=session_id
    )
    assert "SMS" in res3["department_name"]
    assert "SMS" in res3["reply"] or "saúde" in res3["reply"].lower() or "medicamento" in res3["reply"].lower()

    # Turno 4: Cidadão pede segunda via de IPTU -> SEFIN / AUTOATENDIMENTO
    res4 = await MultiAgentOrchestrator.process_turn(
        [
            {"role": "user", "content": "Falta de remédio ou posto de saúde"},
            {"role": "assistant", "content": res3["reply"]},
            {"role": "user", "content": "Segunda via de IPTU ou certidão"}
        ],
        session_id=session_id
    )
    assert "SEFIN" in res4["department_name"]
    assert res4["service_type"] == ServiceType.AUTOATENDIMENTO
    assert res4["self_service_link"] is not None
