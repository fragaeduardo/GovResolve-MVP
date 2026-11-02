import pytest
from src.db.schema import User, UserRole, Department
from src.api.routes.auth import create_token


@pytest.mark.asyncio
async def test_hitl_complete_workflow(client, db_session):
    """
    Testa o fluxo Human-in-the-Loop (HITL) completo do novo frontend:
    1. Usuário conversa via chat e atinge AWAITING_CONFIRMATION com Proposal v1
    2. Consulta GET /demands/chat/{session_id} para restauração de estado
    3. Solicita revisão via POST /demands/chat/{session_id}/revision gerando Proposal v2
    4. Confirmação via POST /demands/chat/{session_id}/confirm formalizando a demanda
    5. Chamada duplicada ao /confirm valida idempotência sem duplicar demanda
    """
    from sqlalchemy import select
    stmt = select(Department).where(Department.name.like("%SEINFRA%"))
    dept = (await db_session.execute(stmt)).scalars().first()
    if not dept:
        dept = Department(name="SEINFRA — Secretaria Municipal de Infraestrutura Urbana", email="seinfra@gov.br")
        db_session.add(dept)
        await db_session.commit()

    cidadao = User(cpf="88877766655", name="Carlos Cidadão", email="carlos_hitl@teste.com", role=UserRole.CIDADAO)
    db_session.add(cidadao)
    await db_session.commit()
    await db_session.refresh(cidadao)

    token = create_token(cidadao)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Enviar mensagem com relato, logradouro, bairro e referência para disparar a proposta HITL
    resp_chat = await client.post(
        "/api/v1/demands/chat",
        headers=headers,
        json={
            "messages": [
                {
                    "role": "user",
                    "content": "Tem um buraco enorme na pista causando risco de acidente na Rua 10, no Setor Central, em frente ao supermercado"
                }
            ]
        }
    )
    assert resp_chat.status_code == 200
    chat_data = resp_chat.json()
    session_id = chat_data["session_id"]
    assert session_id is not None
    assert chat_data["state"] == "AWAITING_CONFIRMATION"
    assert chat_data["proposal"] is not None
    assert chat_data["proposal_version"] == 1
    assert chat_data["ready_to_register"] is True

    # 2. Restaurar sessão via GET /demands/chat/{session_id}
    resp_get_session = await client.get(f"/api/v1/demands/chat/{session_id}", headers=headers)
    assert resp_get_session.status_code == 200
    session_state = resp_get_session.json()
    assert session_state["session_id"] == session_id
    assert session_state["state"] == "AWAITING_CONFIRMATION"
    assert session_state["proposal"]["version"] == 1
    assert len(session_state["messages"]) >= 2

    # 3. Solicitar revisão com alteração de campos
    resp_rev = await client.post(
        f"/api/v1/demands/chat/{session_id}/revision",
        headers=headers,
        json={
            "proposal_version": 1,
            "instructions": "O ponto de referência correto é em frente à Farmácia Popular",
            "slots": {
                "referencia": "em frente à Farmácia Popular",
                "detalhes": "Cratera profunda com cerca de 1 metro de diâmetro"
            }
        }
    )
    assert resp_rev.status_code == 200
    rev_data = resp_rev.json()
    assert rev_data["session_id"] == session_id
    assert rev_data["proposal_version"] == 2
    assert rev_data["state"] == "AWAITING_CONFIRMATION"
    assert rev_data["proposal"]["version"] == 2
    assert rev_data["proposal"]["slots"]["referencia"] == "em frente à Farmácia Popular"
    assert "Farmácia Popular" in rev_data["proposal"]["description"]

    # 4. Confirmar proposta v2
    resp_confirm = await client.post(
        f"/api/v1/demands/chat/{session_id}/confirm",
        headers=headers,
        json={
            "session_id": session_id,
            "approved_proposal_version": 2
        }
    )
    assert resp_confirm.status_code in [200, 201]
    confirm_data = resp_confirm.json()
    assert confirm_data["success"] is True
    protocol = confirm_data["protocol"]
    assert protocol.startswith("GR-")
    assert confirm_data["status"] == "ABERTO"

    # Verificar se a demanda salva no banco reflete a revisão
    resp_demand = await client.get(f"/api/v1/demands/{protocol}", headers=headers)
    assert resp_demand.status_code == 200
    demand_detail = resp_demand.json()
    assert demand_detail["protocol"] == protocol
    assert "Farmácia Popular" in demand_detail["description"]

    # 5. Idempotência: reenviar confirmação na mesma sessão
    resp_confirm_dup = await client.post(
        f"/api/v1/demands/chat/{session_id}/confirm",
        headers=headers,
        json={
            "session_id": session_id,
            "approved_proposal_version": 2
        }
    )
    assert resp_confirm_dup.status_code in [200, 201]
    confirm_dup_data = resp_confirm_dup.json()
    assert confirm_dup_data["success"] is True
    assert confirm_dup_data["protocol"] == protocol


@pytest.mark.asyncio
async def test_hitl_cancellation_workflow(client, db_session):
    """
    Testa o cancelamento de uma sessão antes da formalização:
    1. Inicia conversa
    2. Cidadão cancela via POST /demands/chat/{session_id}/cancel
    3. Estado transiciona para CANCELLED
    """
    cidadao = User(cpf="98712345678", name="Ana Cidadã", email="ana@teste.com", role=UserRole.CIDADAO)
    db_session.add(cidadao)
    await db_session.commit()
    await db_session.refresh(cidadao)

    token = create_token(cidadao)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Iniciar chat
    resp_chat = await client.post(
        "/api/v1/demands/chat",
        headers=headers,
        json={
            "messages": [
                {
                    "role": "user",
                    "content": "Tem um bueiro sem tampa na Rua 4, Setor Oeste, em frente à padaria"
                }
            ]
        }
    )
    assert resp_chat.status_code == 200
    chat_data = resp_chat.json()
    session_id = chat_data["session_id"]

    # 2. Cancelar sessão
    resp_cancel = await client.post(f"/api/v1/demands/chat/{session_id}/cancel", headers=headers)
    assert resp_cancel.status_code == 200
    cancel_data = resp_cancel.json()
    assert cancel_data["session_id"] == session_id
    assert cancel_data["state"] == "CANCELLED"
    assert cancel_data["cancelled"] is True

    # 3. Verificar estado restaurado via GET
    resp_get = await client.get(f"/api/v1/demands/chat/{session_id}", headers=headers)
    assert resp_get.status_code == 200
    assert resp_get.json()["state"] == "CANCELLED"
