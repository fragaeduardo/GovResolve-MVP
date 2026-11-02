from pydantic import BaseModel, Field
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.db.schema import StatusHistory, Demand, DemandSeverity, DemandStatus, Department, User, UserRole
from src.api.schemas import (
    DemandResponse,
    DemandStatusUpdate,
    DemandDetailedResponse,
    PaginatedDemandsResponse,
    SeverityDetail,
    ClassificationDetail,
    DepartmentDetail,
    StatusHistoryDetail,
    FeedbackResponse
)
from src.api.dependencies import require_role, get_user_department_scope
from src.services.demand_service import DemandService

router = APIRouter(prefix="/admin", tags=["Módulo de Tratamento do Servidor (RF011, RF012, RF014, RF016)"])


@router.get("/demands", response_model=Union[PaginatedDemandsResponse, List[DemandResponse]])
async def list_admin_demands(
    department_id: Optional[int] = Query(None),
    status_filter: Optional[DemandStatus] = Query(None),
    severity_filter: Optional[DemandSeverity] = Query(None),
    order_by_priority: bool = Query(False),
    search: Optional[str] = Query(None),
    page: Optional[int] = Query(None),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role([UserRole.SERVIDOR, UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Consulta demandas incluídas no escopo de atendimento do servidor (RF011, RF016).
    Aplica escopo automático aos órgãos autorizados do servidor e suporta busca, filtros e paginação.
    """
    allowed_scope = get_user_department_scope(current_user)
    items, total = await DemandService.list_department_demands(
        db=db,
        department_id=department_id,
        status_filter=status_filter,
        severity_filter=severity_filter,
        order_by_priority=order_by_priority,
        search=search,
        allowed_department_ids=allowed_scope,
        page=page,
        page_size=page_size
    )

    if page is not None:
        import math
        return PaginatedDemandsResponse(
            items=[DemandResponse.model_validate(d) for d in items],
            page=page,
            page_size=page_size,
            total=total,
            pages=math.ceil(total / page_size) if page_size else 1
        )
    return [DemandResponse.model_validate(d) for d in items]


@router.get("/demands/{protocol}", response_model=DemandDetailedResponse)
async def get_server_demand_dossier(
    protocol: str,
    current_user: User = Depends(require_role([UserRole.SERVIDOR, UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Dossiê detalhado da demanda para o servidor público: dados cadastrais, órgão competente,
    justificativa de gravidade pela IA, histórico completo de tramitação e parecer de resolução.
    """
    demand = await DemandService.get_demand_by_protocol(db, protocol)

    # Validação de escopo: servidores só acessam dossiês de demandas dos seus órgãos autorizados
    allowed_scope = get_user_department_scope(current_user)
    if allowed_scope is not None and demand.department_id not in allowed_scope:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: esta ocorrência pertence a um órgão fora do seu escopo funcional."
        )

    history_details = [
        StatusHistoryDetail(
            **{
                "from": h.old_status.value if h.old_status else None,
                "to": h.new_status.value,
                "created_at": h.created_at,
                "notes": h.notes,
                "changed_by_name": h.changed_by.name if h.changed_by else None
            }
        )
        for h in sorted(demand.history or [], key=lambda item: (item.created_at, item.id))
    ]

    dept_detail = DepartmentDetail(id=demand.department.id, name=demand.department.name) if demand.department else None
    feedback_detail = FeedbackResponse.model_validate(demand.feedback) if demand.feedback else None

    return DemandDetailedResponse(
        id=demand.id,
        protocol=demand.protocol,
        title=demand.title,
        description=demand.description,
        status=demand.status,
        severity=SeverityDetail(level=demand.severity, justification=demand.severity_justification),
        classification=ClassificationDetail(category=demand.category, service_type=demand.service_type),
        department=dept_detail,
        organized_summary=demand.organized_summary,
        history=history_details,
        resolution_notes=demand.resolution_notes,
        feedback=feedback_detail,
        citizen_id=demand.citizen_id,
        citizen_name=demand.citizen.name if demand.citizen else None,
        created_at=demand.created_at,
        updated_at=demand.updated_at
    )


@router.patch("/demands/{protocol}/status", response_model=DemandResponse)
async def update_demand_status(
    protocol: str,
    update_data: DemandStatusUpdate,
    current_user: User = Depends(require_role([UserRole.SERVIDOR, UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Atualiza o status ou registra um andamento durante o atendimento.
    Exige parecer de resolução para concluir (RF014).
    """
    demand = await DemandService.get_demand_by_protocol(db, protocol)
    allowed_scope = get_user_department_scope(current_user)
    if allowed_scope is not None and demand.department_id not in allowed_scope:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado: esta reclamação pertence a um órgão fora do seu escopo funcional."
        )
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
    """Retorna métricas consolidadas do setor do servidor autenticado (escopo restrito)."""
    allowed_scope = get_user_department_scope(current_user)

    total_stmt = select(func.count(Demand.id))
    open_stmt = select(func.count(Demand.id)).where(Demand.status == DemandStatus.ABERTO)
    in_progress_stmt = select(func.count(Demand.id)).where(Demand.status == DemandStatus.EM_ANDAMENTO)
    closed_stmt = select(func.count(Demand.id)).where(Demand.status == DemandStatus.FECHADO)

    if allowed_scope is not None:
        total_stmt = total_stmt.where(Demand.department_id.in_(allowed_scope))
        open_stmt = open_stmt.where(Demand.department_id.in_(allowed_scope))
        in_progress_stmt = in_progress_stmt.where(Demand.department_id.in_(allowed_scope))
        closed_stmt = closed_stmt.where(Demand.department_id.in_(allowed_scope))

    total_demands = await db.scalar(total_stmt)
    open_demands = await db.scalar(open_stmt)
    in_progress = await db.scalar(in_progress_stmt)
    closed = await db.scalar(closed_stmt)

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
    Retorna métricas comparativas entre todos os órgãos registrados no sistema (compatibilidade):
    - Total de demandas, status, gravidade e taxa de resolução.
    """
    return await DemandService.get_department_comparison(db)




class ReviewAssignment(BaseModel):
    department_id: int = Field(..., gt=0)


@router.get("/review", response_model=List[DemandResponse])
async def list_review_queue(
    current_user: User = Depends(require_role([UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db),
):
    """Demandas sem orgao atribuido; revisao disponivel somente ao gestor."""
    items = await db.execute(
        select(Demand).where(Demand.department_id.is_(None)).order_by(Demand.created_at.desc())
    )
    return list(items.scalars().all())


@router.post("/review/{protocol}/assign", response_model=DemandResponse)
async def assign_review_queue(
    protocol: str,
    data: ReviewAssignment,
    current_user: User = Depends(require_role([UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db),
):
    """A Ouvidoria classifica um caso nao resolvido automaticamente."""
    demand = await db.scalar(select(Demand).where(Demand.protocol == protocol))
    if demand is None:
        raise HTTPException(status_code=404, detail="Protocolo nao encontrado.")
    if demand.department_id is not None:
        raise HTTPException(status_code=409, detail="Protocolo ja encaminhado.")
    department = await db.get(Department, data.department_id)
    if department is None:
        raise HTTPException(status_code=404, detail="Orgao nao encontrado.")
    demand.department_id = department.id
    db.add(StatusHistory(
        demand_id=demand.id,
        old_status=demand.status,
        new_status=demand.status,
        changed_by_id=current_user.id,
        notes=f"Ouvidoria: demanda atribuida ao orgao {department.name}.",
    ))
    await db.commit()
    await db.refresh(demand)
    return demand
