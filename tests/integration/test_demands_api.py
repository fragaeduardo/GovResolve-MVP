import pytest
from src.db.schema import User, UserRole, Department
from src.api.routes.auth import create_token


@pytest.mark.asyncio
async def test_full_demand_lifecycle_api(client, db_session):
    """
    Testa o ciclo de vida completo via API REST:
    1. Cidadão autentica (RF001)
    2. Cidadão registra demanda e recebe protocolo único em <3s (RF002, RF003, RNF003)
    3. Cidadão consulta andamento da demanda por protocolo (RF004)
    4. Servidor lista demandas sob sua responsabilidade (RF011)
    5. Servidor avança status para EM ANDAMENTO (RF012)
    6. Servidor conclui demanda registrando parecer obrigatório (RF012, RF014)
    7. Cidadão envia avaliação/feedback sobre o atendimento (RF015)
    """
    # Setup de dados iniciais
    dept = Department(name="Secretaria de Obras e Infraestrutura", email="obras@gov.br")
    cidadao = User(cpf="11122233300", name="Maria Silva", email="maria@exemplo.com", role=UserRole.CIDADAO)
    servidor = User(cpf="44455566600", name="Carlos Servidor", email="carlos@gov.br", role=UserRole.SERVIDOR)
    db_session.add_all([dept, cidadao, servidor])
    await db_session.commit()
    await db_session.refresh(cidadao)
    await db_session.refresh(servidor)
    servidor.department_id = dept.id
    await db_session.commit()

    token_cidadao = create_token(cidadao)
    token_servidor = create_token(servidor)
    headers_cidadao = {"Authorization": f"Bearer {token_cidadao}"}
    headers_servidor = {"Authorization": f"Bearer {token_servidor}"}

    # 1. Registro de Demanda
    resp_create = await client.post(
        "/api/v1/demands",
        headers=headers_cidadao,
        json={
            "title": "Bueiro entupido causando alagamento",
            "description": "Na esquina da Rua 5 com a Avenida B o bueiro transborda toda vez que chove.",
            "department_id": dept.id,
            "severity": "ALTA",
            "category": "Obras e Pavimentacao"
        }
    )
    assert resp_create.status_code == 201
    demand_data = resp_create.json()
    protocol = demand_data["protocol"]
    assert protocol.startswith("GR-")
    assert demand_data["status"] == "ABERTO"

    # 2. Consulta por Protocolo pelo Cidadão
    resp_get = await client.get(f"/api/v1/demands/{protocol}", headers=headers_cidadao)
    assert resp_get.status_code == 200
    assert resp_get.json()["protocol"] == protocol

    # 3. Listagem pelo Servidor
    resp_admin_list = await client.get("/api/v1/admin/demands", headers=headers_servidor)
    assert resp_admin_list.status_code == 200
    protocols = [d["protocol"] for d in resp_admin_list.json()]
    assert protocol in protocols

    # 4. Atualização para EM ANDAMENTO pelo Servidor
    resp_step1 = await client.patch(
        f"/api/v1/admin/demands/{protocol}/status",
        headers=headers_servidor,
        json={"new_status": "EM ANDAMENTO", "notes": "Caminhão limpa-fossa destacado para o local."}
    )
    assert resp_step1.status_code == 200
    assert resp_step1.json()["status"] == "EM ANDAMENTO"

    # 5. Tentativa de Feedback prematuro antes do fechamento (deve falhar com 400)
    resp_feedback_early = await client.post(
        f"/api/v1/demands/{protocol}/feedback",
        headers=headers_cidadao,
        json={"rating": 5, "comment": "Muito rápido!"}
    )
    assert resp_feedback_early.status_code == 400

    # 6. Conclusão da Demanda (FECHADO) com parecer obrigatório
    resp_step2 = await client.patch(
        f"/api/v1/admin/demands/{protocol}/status",
        headers=headers_servidor,
        json={
            "new_status": "FECHADO",
            "notes": "Desobstrução concluída.",
            "resolution_notes": "Bueiro limpo e desobstruído com remoção de 20kg de entulho. Fluxo de drenagem normalizado."
        }
    )
    assert resp_step2.status_code == 200
    assert resp_step2.json()["status"] == "FECHADO"
    assert "drenagem normalizado" in resp_step2.json()["resolution_notes"]

    # 7. Cidadão envia avaliação/feedback com sucesso (RF015)
    resp_feedback = await client.post(
        f"/api/v1/demands/{protocol}/feedback",
        headers=headers_cidadao,
        json={"rating": 5, "comment": "Excelente atendimento e rapidez da equipe!"}
    )
    assert resp_feedback.status_code == 201
    assert resp_feedback.json()["rating"] == 5


@pytest.mark.asyncio
async def test_citizen_chat_assistant_flow(client, db_session):
    """Testa o endpoint de chatbot inteligente de atendimento ao cidadão."""
    cidadao = User(cpf="99911122233", name="Joana Costa", email="joana@exemplo.com", role=UserRole.CIDADAO)
    from sqlalchemy import select
    dept_name = "SEINFRA — Secretaria Municipal de Infraestrutura Urbana"
    dept = await db_session.scalar(select(Department).where(Department.name == dept_name))
    db_session.add(cidadao)
    if not dept:
        db_session.add(Department(name=dept_name, email="obras_chat@teste.gov.br"))
    await db_session.commit()

    token = create_token(cidadao)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Mensagem inicial sem localização -> Agente solicita localização
    resp1 = await client.post(
        "/api/v1/demands/chat",
        headers=headers,
        json={
            "messages": [
                {"role": "user", "content": "Tem um buraco gigante no asfalto que está causando acidentes"}
            ]
        }
    )
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert any(w in data1["reply"].lower() for w in ["endereço", "localização", "rua", "logradouro"])


    # 2. Usuário fornece localização -> Agente estrutura e marca ready_to_register
    resp2 = await client.post(
        "/api/v1/demands/chat",
        headers=headers,
        json={
            "session_id": data1["session_id"],
            "messages": [
                {"role": "user", "content": "Tem um buraco gigante no asfalto que está causando acidentes"},
                {"role": "assistant", "content": data1["reply"]},
                {"role": "user", "content": "É na Rua 10 com a Avenida Brasil, no Setor Central, em frente ao supermercado"}
            ]
        }
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["ready_to_register"] is True
    assert "SEINFRA" in data2["department_name"]

    # 3. Cidadão aprova e confirma (Human-in-the-Loop) -> FormalizationAgent executa Tool no banco
    resp3 = await client.post(
        "/api/v1/demands/chat/formalize",
        headers=headers,
        json={
            "session_id": data2.get("session_id"),
            "title": data2.get("suggested_title"),
            "description": data2.get("suggested_description")
        }
    )
    assert resp3.status_code == 201
    data3 = resp3.json()
    assert data3["success"] is True
    assert data3["protocol"].startswith("GR-")
    assert data3["status"] == "ABERTO"
    assert any(term in data3["department_name"] for term in ["SEINFRA", "Obras", "Infraestrutura"])
    assert data3["demand"]["id"] is not None
    assert "protocolo" in data3["reply"].lower()

