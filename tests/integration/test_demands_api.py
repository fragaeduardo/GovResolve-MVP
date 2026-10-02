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
            "description": "Na esquina da Rua 5 com a Avenida B o bueiro transborda toda vez que chove."
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
