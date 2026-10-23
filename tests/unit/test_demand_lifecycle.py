import pytest
from fastapi import HTTPException
from src.db.schema import Demand, DemandStatus, ServiceType, User, UserRole, Department
from src.services.demand_service import DemandService
from src.api.schemas import DemandStatusUpdate, FeedbackCreate


def test_protocol_generation_format():
    """Valida o formato e unicidade do protocolo gerado (RF003)."""
    p1 = DemandService.generate_protocol()
    p2 = DemandService.generate_protocol()

    assert p1.startswith("GR-")
    assert p2.startswith("GR-")
    assert p1 != p2
    assert len(p1) >= 16


@pytest.mark.asyncio
async def test_demand_status_transitions_valid(db_session):
    """Valida o fluxo estrito: ABERTO -> EM ANDAMENTO -> FECHADO (RF012, RF014)."""
    # Cria cidadão e servidor no banco de teste
    citizen = User(cpf="12345678901", name="Cidadao Teste", email="c@test.com", role=UserRole.CIDADAO)
    servidor = User(cpf="98765432100", name="Servidor Teste", email="s@test.com", role=UserRole.SERVIDOR)
    dept = Department(name="Secretaria de Obras", email="obras@test.com")
    db_session.add_all([citizen, servidor, dept])
    await db_session.commit()
    await db_session.refresh(citizen)
    await db_session.refresh(servidor)
    await db_session.refresh(dept)
    servidor.department_id = dept.id
    await db_session.commit()

    demand = Demand(
        protocol=DemandService.generate_protocol(),
        title="Buraco na Rua das Flores",
        description="Existe um buraco muito fundo em frente ao número 100.",
        citizen_id=citizen.id,
        department_id=dept.id,
        status=DemandStatus.ABERTO,
        service_type=ServiceType.ATENDIMENTO_PUBLICO
    )
    db_session.add(demand)
    await db_session.commit()

    # 1. Transição ABERTO -> EM ANDAMENTO (Válida)
    updated_1 = await DemandService.update_status(
        db_session,
        demand.protocol,
        DemandStatusUpdate(new_status=DemandStatus.EM_ANDAMENTO, notes="Equipe encaminhada ao local"),
        servidor
    )
    assert updated_1.status == DemandStatus.EM_ANDAMENTO

    # 2. Transição EM ANDAMENTO -> FECHADO com parecer de resolução (Válida)
    updated_2 = await DemandService.update_status(
        db_session,
        demand.protocol,
        DemandStatusUpdate(
            new_status=DemandStatus.FECHADO,
            notes="Serviço finalizado com sucesso.",
            resolution_notes="Operação tapa-buraco executada em 02/10/2026. Pavimento recomposto."
        ),
        servidor
    )
    assert updated_2.status == DemandStatus.FECHADO
    assert "recomposto" in updated_2.resolution_notes


@pytest.mark.asyncio
async def test_demand_status_invalid_transition_skip_step(db_session):
    """Bloqueia salto direto inválido de ABERTO para FECHADO (RF012)."""
    citizen = User(cpf="11122233344", name="Cidadao Teste 2", email="c2@test.com", role=UserRole.CIDADAO)
    servidor = User(cpf="55566677788", name="Servidor Teste 2", email="s2@test.com", role=UserRole.GESTOR)
    db_session.add_all([citizen, servidor])
    await db_session.commit()

    demand = Demand(
        protocol=DemandService.generate_protocol(),
        title="Poste apagado",
        description="Poste apagado há 3 dias na praça central.",
        citizen_id=citizen.id,
        status=DemandStatus.ABERTO
    )
    db_session.add(demand)
    await db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        await DemandService.update_status(
            db_session,
            demand.protocol,
            DemandStatusUpdate(new_status=DemandStatus.FECHADO, resolution_notes="Poste trocado"),
            servidor
        )
    assert exc_info.value.status_code == 400
    assert "Transição inválida" in exc_info.value.detail


@pytest.mark.asyncio
async def test_demand_status_fechado_requires_resolution_notes(db_session):
    """Exige obrigatoriamente o parecer técnico ao fechar demanda (RF014)."""
    citizen = User(cpf="99988877766", name="Cidadao Teste 3", email="c3@test.com", role=UserRole.CIDADAO)
    servidor = User(cpf="44433322211", name="Servidor Teste 3", email="s3@test.com", role=UserRole.SERVIDOR)
    db_session.add_all([citizen, servidor])
    await db_session.commit()

    demand = Demand(
        protocol=DemandService.generate_protocol(),
        title="Poda de árvore",
        description="Galhos encostando nos fios elétricos.",
        citizen_id=citizen.id,
        status=DemandStatus.EM_ANDAMENTO
    )
    db_session.add(demand)
    await db_session.commit()

    # Tentativa de fechamento sem resolution_notes deve falhar
    with pytest.raises(HTTPException) as exc_info:
        await DemandService.update_status(
            db_session,
            demand.protocol,
            DemandStatusUpdate(new_status=DemandStatus.FECHADO, resolution_notes=""),
            servidor
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_citizen_cannot_update_status(db_session):
    """Garante controle estrito de RBAC: cidadão não pode alterar status (RF013, HU011)."""
    citizen = User(cpf="77788899900", name="Cidadao Sem Permissao", email="c4@test.com", role=UserRole.CIDADAO)
    db_session.add(citizen)
    await db_session.commit()

    demand = Demand(
        protocol=DemandService.generate_protocol(),
        title="Vazamento de água",
        description="Cano quebrado na calçada.",
        citizen_id=citizen.id,
        status=DemandStatus.ABERTO
    )
    db_session.add(demand)
    await db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        await DemandService.update_status(
            db_session,
            demand.protocol,
            DemandStatusUpdate(new_status=DemandStatus.EM_ANDAMENTO),
            citizen
        )
    assert exc_info.value.status_code == 403
