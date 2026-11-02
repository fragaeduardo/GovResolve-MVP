from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.db.schema import User, UserRole
from src.api.schemas import ManagementOverviewResponse, DepartmentComparisonResponse
from src.api.dependencies import require_role
from src.services.demand_service import DemandService

router = APIRouter(prefix="/management", tags=["Gestão e Indicadores Estratégicos"])


@router.get("/overview", response_model=ManagementOverviewResponse)
async def get_management_overview(
    current_user: User = Depends(require_role([UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Visão geral executiva e indicadores municipais consolidados.
    Exclusivo para o papel GESTOR. Apresenta total de demandas, distribuição por status,
    severidade e taxa percentual de resolução.
    """
    return await DemandService.get_management_overview(db)


@router.get("/departments", response_model=List[DepartmentComparisonResponse])
async def get_department_comparison(
    current_user: User = Depends(require_role([UserRole.GESTOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Comparativo de desempenho operacional entre todos os órgãos e secretarias municipais.
    Exclusivo para o papel GESTOR. Detalha volume total, demandas abertas/em andamento/fechadas,
    distribuição por gravidade e taxa de resolução de cada pasta.
    """
    return await DemandService.get_department_comparison(db)
