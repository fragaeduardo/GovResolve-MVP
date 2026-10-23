import os
import json
import pytest
from src.db.schema import User, UserRole, Department, Demand, DemandStatus, DemandSeverity
from src.api.routes.auth import create_token


def test_departments_jsonl_catalog_exists():
    """Garante que todas as opções de órgãos estão devidamente registradas em departments.jsonl."""
    assert os.path.exists("data/departments.jsonl")
    with open("data/departments.jsonl", "r", encoding="utf-8") as f:
        lines = [json.loads(line.strip()) for line in f if line.strip()]
    assert len(lines) == 12
    codes = {d["code"] for d in lines}
    expected = {"SEINFRA", "COMURG", "SMS", "SET", "AMMA", "SEFAZ", "SME", "SANEAGO", "CMTC", "AGCM", "PROCON", "SEMASDH"}
    assert expected.issubset(codes)


@pytest.mark.asyncio
async def test_flexible_login_for_mvp(client, db_session, monkeypatch):
    """Modo demo cria cidadaos, mas nao permite auto-promocao administrativa."""
    from src.config import settings
    monkeypatch.setattr(settings, "DEMO_STAFF_ACCESS_CODE", "staff-demo-code-change-me")

    # Pedir servidor sem possuir conta e codigo deve falhar.
    res_server = await client.post("/api/v1/auth/login", json={
        "cpf": "MAT-2024-8841", "name": "Servidor Teste", "role": "servidor"
    })
    assert res_server.status_code == 403

    # Qualquer CPF de demo pode se cadastrar apenas como cidadao.
    res_citizen = await client.post("/api/v1/auth/login", json={
        "cpf": "maria_cidada", "name": "Maria Cidada", "role": "cidadao"
    })
    assert res_citizen.status_code == 200
    assert res_citizen.json()["user"]["role"] == "cidadao"

    staff = User(
        cpf="88811122233", name="Servidor Preexistente",
        email="staff_demo@example.com", role=UserRole.SERVIDOR
    )
    db_session.add(staff)
    await db_session.commit()

    denied = await client.post("/api/v1/auth/login", json={
        "cpf": staff.cpf, "role": "servidor", "staff_access_code": "errado"
    })
    assert denied.status_code == 403
    allowed = await client.post("/api/v1/auth/login", json={
        "cpf": staff.cpf, "role": "servidor",
        "staff_access_code": "staff-demo-code-change-me"
    })
    assert allowed.status_code == 200
    assert allowed.json()["user"]["role"] == "servidor"


@pytest.mark.asyncio
async def test_public_departments_endpoint(client, db_session):
    """Testa endpoint público de listagem de órgãos para seleção na tela de login e filtros."""
    dept = Department(name="SEINFRA — Secretaria Municipal de Infraestrutura Urbana", email="seinfra@prefeitura.gov.br")
    db_session.add(dept)
    await db_session.commit()

    res = await client.get("/api/v1/demands/departments")
    assert res.status_code == 200
    departments = res.json()
    assert isinstance(departments, list)
    assert any("SEINFRA" in d["name"] for d in departments)


@pytest.mark.asyncio
async def test_admin_priority_ordering_and_comparison(client, db_session):
    """Testa ordenação por prioridade e estatísticas comparativas entre órgãos."""
    dept1 = Department(name="SMS — Secretaria Municipal de Saúde", email="saude_comp@gov.br")
    dept2 = Department(name="COMURG — Limpeza Urbana", email="comurg_comp@gov.br")
    servidor = User(cpf="98765432101", name="Gestor Geral", email="gestor_comp@gov.br", role=UserRole.GESTOR)
    cidadao = User(cpf="87654321092", name="Cidadão Teste", email="cidadao_comp@gov.br", role=UserRole.CIDADAO)

    db_session.add_all([dept1, dept2, servidor, cidadao])
    await db_session.commit()
    await db_session.refresh(dept1)
    await db_session.refresh(dept2)
    await db_session.refresh(servidor)
    await db_session.refresh(cidadao)

    # Cria demanda BAIXA para dept1
    d_baixa = Demand(
        protocol="GR-20261002-BAIXA",
        title="Poda de arbusto",
        description="Arbusto na calçada",
        citizen_id=cidadao.id,
        department_id=dept1.id,
        status=DemandStatus.ABERTO,
        severity=DemandSeverity.BAIXA
    )
    # Cria demanda CRITICA para dept1
    d_critica = Demand(
        protocol="GR-20261002-CRIT1",
        title="Cratera aberta",
        description="Risco iminente de acidente grave",
        citizen_id=cidadao.id,
        department_id=dept1.id,
        status=DemandStatus.ABERTO,
        severity=DemandSeverity.CRITICA
    )
    # Cria demanda FECHADA para dept2
    d_fechada = Demand(
        protocol="GR-20261002-FECH1",
        title="Lixo recolhido",
        description="Lixo recolhido com sucesso",
        citizen_id=cidadao.id,
        department_id=dept2.id,
        status=DemandStatus.FECHADO,
        severity=DemandSeverity.MEDIA,
        resolution_notes="Serviço executado pela equipe."
    )

    db_session.add_all([d_baixa, d_critica, d_fechada])
    await db_session.commit()

    token = create_token(servidor)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Testa listagem ordenada por prioridade
    res_priority = await client.get("/api/v1/admin/demands?order_by_priority=true", headers=headers)
    assert res_priority.status_code == 200
    demands_list = res_priority.json()
    protocols = [d["protocol"] for d in demands_list]
    # A demanda crítica deve aparecer antes da demanda baixa
    assert protocols.index("GR-20261002-CRIT1") < protocols.index("GR-20261002-BAIXA")

    # 2. Testa endpoint comparativo entre órgãos
    res_comp = await client.get("/api/v1/admin/department-comparison", headers=headers)
    assert res_comp.status_code == 200
    comp_list = res_comp.json()
    assert isinstance(comp_list, list)

    dept1_data = next((c for c in comp_list if c["department_id"] == dept1.id), None)
    assert dept1_data is not None
    assert dept1_data["total"] >= 2
    assert dept1_data["critica"] >= 1

    dept2_data = next((c for c in comp_list if c["department_id"] == dept2.id), None)
    assert dept2_data is not None
    assert dept2_data["fechado"] >= 1
    assert dept2_data["resolution_rate"] > 0
