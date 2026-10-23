"""Demonstration access, department isolation, and human review regression tests."""
import pytest

from src.config import settings
from src.db.schema import Demand, Department, User, UserRole
from src.api.routes.auth import create_token


@pytest.mark.asyncio
async def test_demo_roles_and_department_selection(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", True)
    monkeypatch.setattr(settings, "DEBUG", True)
    monkeypatch.setattr(settings, "ENV", "development")

    one = Department(code="DEMO_A", name="Departamento Demonstracao A", email="demo-a@example.com")
    two = Department(code="DEMO_B", name="Departamento Demonstracao B", email="demo-b@example.com")
    db_session.add_all([one, two])
    await db_session.commit()
    await db_session.refresh(one)
    await db_session.refresh(two)

    config = await client.get("/api/v1/auth/demo-config")
    assert config.json()["enabled"] is True

    citizen = await client.post("/api/v1/auth/demo", json={"role": "cidadao"})
    assert citizen.status_code == 200
    assert citizen.json()["user"]["role"] == "cidadao"
    assert citizen.json()["user"]["department_id"] is None

    missing = await client.post("/api/v1/auth/demo", json={"role": "servidor"})
    assert missing.status_code == 422

    invalid = await client.post("/api/v1/auth/demo", json={"role": "servidor", "department_id": 99999999})
    assert invalid.status_code == 404

    a = await client.post("/api/v1/auth/demo", json={"role": "servidor", "department_id": one.id})
    b = await client.post("/api/v1/auth/demo", json={"role": "servidor", "department_id": two.id})
    assert a.status_code == b.status_code == 200
    assert a.json()["user"]["department_id"] == one.id
    assert b.json()["user"]["department_id"] == two.id
    assert a.json()["user"]["id"] != b.json()["user"]["id"]

    manager = await client.post("/api/v1/auth/demo", json={"role": "gestor"})
    assert manager.status_code == 200
    assert manager.json()["user"]["role"] == "gestor"

    # Usuario so pode ver demandas do orgao selecionado.
    owner = await db_session.get(User, citizen.json()["user"]["id"])
    protected = Demand(
        protocol="GR-20261023-SCOPE2",
        title="Demanda de outro departamento",
        description="Ocorrencia usada somente para validar permissao.",
        citizen_id=owner.id, department_id=one.id
    )
    db_session.add(protected)
    await db_session.commit()

    own = await client.get("/api/v1/admin/demands", headers={
        "Authorization": f"Bearer {a.json()['access_token']}"
    })
    other = await client.get("/api/v1/admin/demands", headers={
        "Authorization": f"Bearer {b.json()['access_token']}"
    })
    assert protected.protocol in [d["protocol"] for d in own.json()]
    assert protected.protocol not in [d["protocol"] for d in other.json()]


@pytest.mark.asyncio
async def test_demo_tokens_are_revoked_when_mode_is_disabled(client, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", True)
    monkeypatch.setattr(settings, "DEBUG", True)
    monkeypatch.setattr(settings, "ENV", "development")
    login = await client.post("/api/v1/auth/demo", json={"role": "cidadao"})
    assert login.status_code == 200
    token = login.json()["access_token"]

    monkeypatch.setattr(settings, "DEMO_MODE", False)
    disabled = await client.post("/api/v1/auth/demo", json={"role": "gestor"})
    assert disabled.status_code == 403
    profile = await client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert profile.status_code == 401


@pytest.mark.asyncio
async def test_manager_reviews_unassigned_tickets(client, db_session):
    department = Department(code="REVIEW_DST", name="Destino de Revisao Teste", email="review-dst@example.com")
    owner = User(cpf="77444888990", name="Cidadão do teste", email="testreview@example.com", role=UserRole.CIDADAO)
    manager = User(cpf="77444888991", name="Gestor do teste", email="managerreview@example.com", role=UserRole.GESTOR)
    db_session.add_all([department, owner, manager])
    await db_session.commit()
    await db_session.refresh(department)
    await db_session.refresh(owner)
    await db_session.refresh(manager)

    d = Demand(
        protocol="GR-20261023-REVIEW",
        title="Revisao da Ouvidoria",
        description="Atendimento a ser classificado manualmente.",
        citizen_id=owner.id,
        department_id=None
    )
    db_session.add(d)
    await db_session.commit()

    citizen_auth = {"Authorization": f"Bearer {create_token(owner)}"}
    manager_auth = {"Authorization": f"Bearer {create_token(manager)}"}
    forbidden = await client.get("/api/v1/admin/review", headers=citizen_auth)
    assert forbidden.status_code == 403

    review = await client.get("/api/v1/admin/review", headers=manager_auth)
    assert review.status_code == 200
    assert d.protocol in [item["protocol"] for item in review.json()]

    assigned = await client.post(
        f"/api/v1/admin/review/{d.protocol}/assign",
        headers=manager_auth, json={"department_id": department.id}
    )
    assert assigned.status_code == 200
    assert assigned.json()["department_id"] == department.id
    repeated = await client.post(
        f"/api/v1/admin/review/{d.protocol}/assign",
        headers=manager_auth, json={"department_id": department.id}
    )
    assert repeated.status_code == 409
