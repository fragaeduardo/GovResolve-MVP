import json
from types import SimpleNamespace

import pytest
from sqlalchemy import func, select

from src.ai.agents.requirements_agent import RequirementsAgent
from src.ai.agents.semantic_router import SemanticRoutingAgent
from src.ai.agents.severity_agent import SeverityClassificationAgent
from src.ai.service import AIScreeningService
from src.api.routes.auth import create_token
from src.db.schema import Demand, DemandSeverity, DemandStatus, Department, User, UserRole


def test_requirements_are_contextual():
    health = RequirementsAgent.analyze("Falta medicamento na UBS do meu bairro.")
    road = RequirementsAgent.analyze("Buraco perigoso no asfalto da via.")
    assert health.mandatory_slots == ["relato"]
    assert road.mandatory_slots == ["logradouro", "bairro", "referencia"]


@pytest.mark.asyncio
async def test_semantic_route_requires_catalog_and_literal_evidence(monkeypatch):
    async def good_model(*args, **kwargs):
        return json.dumps({
            "department_code": "PROCON",
            "confidence": 0.93,
            "evidence": "produto vencido"
        })
    monkeypatch.setattr(AIScreeningService, "call_llm_with_fallback", good_model)
    ok = await SemanticRoutingAgent.route("Comprei um produto vencido no supermercado.")
    assert ok is not None
    assert "PROCON" in ok.department_name
    assert ok.mandatory_slots == ["relato"]

    async def bad_model(*args, **kwargs):
        return json.dumps({
            "department_code": "ORGAO_INVENTADO",
            "confidence": 1.0, "evidence": "produto vencido"
        })
    monkeypatch.setattr(AIScreeningService, "call_llm_with_fallback", bad_model)
    assert await SemanticRoutingAgent.route("Comprei produto vencido.") is None


@pytest.mark.asyncio
async def test_chat_session_is_private_and_cannot_skip_approval(client, db_session):
    owner = User(cpf="44111222333", name="Usuario A", email="owner_a@example.invalid", role=UserRole.CIDADAO)
    intruder = User(cpf="44111222334", name="Usuario B", email="owner_b@example.invalid", role=UserRole.CIDADAO)
    db_session.add_all([owner, intruder])
    await db_session.commit()

    first = await client.post("/api/v1/demands/chat", headers={
        "Authorization": f"Bearer {create_token(owner)}"
    }, json={"messages": [{"role": "user", "content": "Um buraco perigoso no asfalto"}]})
    assert first.status_code == 200
    sid = first.json()["session_id"]
    assert first.json()["ready_to_register"] is False

    attempt = await client.post("/api/v1/demands/chat/formalize", headers={
        "Authorization": f"Bearer {create_token(owner)}"
    }, json={"session_id": sid, "title": "Título forjado", "description": "Descrição forjada do cidadão."})
    assert attempt.status_code == 409

    stolen_chat = await client.post("/api/v1/demands/chat", headers={
        "Authorization": f"Bearer {create_token(intruder)}"
    }, json={"session_id": sid, "messages": [{"role": "user", "content": "Rua 1 no Centro"}]})
    assert stolen_chat.status_code == 403

    stolen_formalize = await client.post("/api/v1/demands/chat/formalize", headers={
        "Authorization": f"Bearer {create_token(intruder)}"
    }, json={"session_id": sid})
    assert stolen_formalize.status_code == 403


@pytest.mark.asyncio
async def test_approved_chat_is_idempotent_and_rejects_changed_payload(client, db_session, monkeypatch):
    async def fake_severity(*args, **kwargs):
        return SimpleNamespace(severity=DemandSeverity.ALTA, severity_justification="Risco informado no relato")
    monkeypatch.setattr(SeverityClassificationAgent, "classify_demand", fake_severity)

    owner = User(cpf="55222333444", name="Usuario C", email="owner_c@example.invalid", role=UserRole.CIDADAO)
    dept_name = "SEINFRA — Secretaria Municipal de Infraestrutura Urbana"
    dept = await db_session.scalar(select(Department).where(Department.name == dept_name))
    db_session.add(owner)
    if not dept:
        db_session.add(Department(name=dept_name, email="seinfra-regression@example.invalid"))
    await db_session.commit()
    auth = {"Authorization": f"Bearer {create_token(owner)}"}

    ready = await client.post("/api/v1/demands/chat", headers=auth, json={
        "messages": [{"role": "user", "content":
            "Buraco no asfalto da Rua 10, no Setor Bueno, em frente ao número 200."
        }]
    })
    assert ready.status_code == 200
    assert ready.json()["ready_to_register"] is True
    sid = ready.json()["session_id"]

    forged = await client.post("/api/v1/demands/chat/formalize", headers=auth, json={
        "session_id": sid, "title": "Outro assunto"
    })
    assert forged.status_code == 409

    first = await client.post("/api/v1/demands/chat/formalize", headers=auth, json={
        "session_id": sid,
        "title": ready.json()["suggested_title"],
        "description": ready.json()["suggested_description"]
    })
    assert first.status_code == 201

    repeated = await client.post("/api/v1/demands/chat/formalize", headers=auth, json={
        "session_id": sid
    })
    assert repeated.status_code == 201
    assert repeated.json()["protocol"] == first.json()["protocol"]

    count = await db_session.scalar(select(func.count(Demand.id)).where(Demand.chat_session_id == sid))
    assert count == 1


@pytest.mark.asyncio
async def test_staff_cannot_read_or_update_other_department(client, db_session):
    local = Department(name="Departamento Local Escopo", email="local-scope@example.invalid")
    other = Department(name="Outro Departamento Escopo", email="other-scope@example.invalid")
    db_session.add_all([local, other])
    await db_session.commit()
    staff = User(
        cpf="66111222333", name="Servidor A", email="staff_a@example.invalid",
        role=UserRole.SERVIDOR, department_id=local.id
    )
    citizen = User(cpf="66111222334", name="Cidadao A", email="citizen_a@example.invalid", role=UserRole.CIDADAO)
    db_session.add_all([staff, citizen])
    await db_session.commit()
    protected = Demand(
        protocol="GR-20261023-CROSS", title="Demanda de outro setor",
        description="Assunto apenas do outro departamento", citizen_id=citizen.id,
        department_id=other.id, status=DemandStatus.ABERTO
    )
    db_session.add(protected)
    await db_session.commit()

    auth = {"Authorization": f"Bearer {create_token(staff)}"}
    queue = await client.get("/api/v1/admin/demands", headers=auth)
    assert queue.status_code == 200
    assert protected.protocol not in [item["protocol"] for item in queue.json()]

    forced_filter = await client.get(f"/api/v1/admin/demands?department_id={other.id}", headers=auth)
    assert forced_filter.status_code == 403
    forced_read = await client.get(f"/api/v1/demands/{protected.protocol}", headers=auth)
    assert forced_read.status_code == 403
    forced_patch = await client.patch(
        f"/api/v1/admin/demands/{protected.protocol}/status",
        headers=auth, json={"new_status": "EM ANDAMENTO"}
    )
    assert forced_patch.status_code == 403
