from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.db.schema import Demand, DemandSeverity, DemandStatus, Department, User, UserRole
from src.api.schemas import DemandResponse, DemandStatusUpdate
from src.api.dependencies import require_role
from src.services.demand_service import DemandService

router = APIRouter(prefix="/admin", tags=["Módulo de Tratamento do Servidor (RF011, RF012, RF014, RF016)"])


@router.get("/demands", response_model=List[DemandResponse])
async def list_admin_demands(
    department_id: Optional[int] = None,
    status_filter: Optional[DemandStatus] = None,
    severity_filter: Optional[DemandSeverity] = None,
    order_by_priority: bool = False,
    search: Optional[str] = None,
    current_user: User = Depends(require_role([UserRole.SERVIDOR, UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Consulta demandas incluídas no escopo de atendimento do servidor (RF011, RF016).
    Permite filtrar por departamento, status, gravidade, termo de busca e ordenar por prioridade.
    """
    return await DemandService.list_department_demands(
        db, department_id, status_filter, severity_filter, order_by_priority, search
    )


@router.patch("/demands/{protocol}/status", response_model=DemandResponse)
async def update_demand_status(
    protocol: str,
    update_data: DemandStatusUpdate,
    current_user: User = Depends(require_role([UserRole.SERVIDOR, UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Atualiza o status da demanda respeitando a máquina de estados:
    ABERTO → EM ANDAMENTO → FECHADO (RF012).
    Exige obrigatoriamente o parecer de resolução ao concluir (RF014).
    """
    return await DemandService.update_status(db, protocol, update_data, current_user)


@router.get("/departments")
async def list_departments(
    current_user: User = Depends(require_role([UserRole.SERVIDOR, UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """Lista todos os departamentos cadastrados."""
    res = await db.execute(select(Department).order_by(Department.name))
    return [{"id": d.id, "name": d.name, "description": d.description, "email": d.email} for d in res.scalars().all()]


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_role([UserRole.SERVIDOR, UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """Retorna métricas consolidadas do painel de gestão."""
    total_demands = await db.scalar(select(func.count(Demand.id)))
    open_demands = await db.scalar(select(func.count(Demand.id)).where(Demand.status == DemandStatus.ABERTO))
    in_progress = await db.scalar(select(func.count(Demand.id)).where(Demand.status == DemandStatus.EM_ANDAMENTO))
    closed = await db.scalar(select(func.count(Demand.id)).where(Demand.status == DemandStatus.FECHADO))

    return {
        "total": total_demands or 0,
        "aberto": open_demands or 0,
        "em_andamento": in_progress or 0,
        "fechado": closed or 0
    }


@router.get("/department-comparison")
async def get_department_comparison(
    current_user: User = Depends(require_role([UserRole.SERVIDOR, UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna métricas comparativas entre todos os órgãos registrados no sistema:
    - Total de demandas
    - Demandas em aberto, em andamento e fechadas
    - Distribuição por gravidade (crítica, alta, média, baixa)
    - Taxa de resolução (%)
    """
    depts_res = await db.execute(select(Department).order_by(Department.name))
    departments = depts_res.scalars().all()

    demands_res = await db.execute(select(Demand))
    demands = demands_res.scalars().all()

    comparison = []
    for dept in departments:
        dept_demands = [d for d in demands if d.department_id == dept.id]
        total = len(dept_demands)
        aberto = sum(1 for d in dept_demands if d.status == DemandStatus.ABERTO)
        em_andamento = sum(1 for d in dept_demands if d.status == DemandStatus.EM_ANDAMENTO)
        fechado = sum(1 for d in dept_demands if d.status == DemandStatus.FECHADO)

        critica = sum(1 for d in dept_demands if d.severity == DemandSeverity.CRITICA)
        alta = sum(1 for d in dept_demands if d.severity == DemandSeverity.ALTA)
        media = sum(1 for d in dept_demands if d.severity == DemandSeverity.MEDIA)
        baixa = sum(1 for d in dept_demands if d.severity == DemandSeverity.BAIXA)

        resolution_rate = round((fechado / total * 100), 1) if total > 0 else 0.0

        comparison.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "email": dept.email,
            "total": total,
            "aberto": aberto,
            "em_andamento": em_andamento,
            "fechado": fechado,
            "critica": critica,
            "alta": alta,
            "media": media,
            "baixa": baixa,
            "resolution_rate": resolution_rate
        })

    return comparison

