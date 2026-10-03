import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.schema import Demand, User
from src.api.schemas import DemandCreate, DemandResponse

logger = logging.getLogger("govresolve.ai.tools.demand")


class RegisterDemandInput(BaseModel):
    title: str = Field(..., description="Título resumido e estruturado da reclamação")
    description: str = Field(..., description="Descrição factual contendo logradouro, bairro, referência e detalhes")


class ToolExecutionResult(BaseModel):
    success: bool
    protocol: Optional[str] = None
    severity: Optional[str] = None
    severity_justification: Optional[str] = None
    message: str
    demand: Optional[DemandResponse] = None


class DemandRegistrationTool:
    """
    Tool formal de Registro de Demanda no Banco de Dados Relacional.
    
    Padrão de Execução: Human-in-the-Loop Gated Tool
    - O agente prepara o payload da tool ('register_demand') após reunir todos os requisitos.
    - A ferramenta NÃO é executada autonomamente pelo agente.
    - A execução fica estritamente bloqueada até que o cidadão revise e aprove o cartão no frontend.
    - Sob aprovação humana, a tool persiste a demanda, aciona a classificação de gravidade pós-aprovação
      e dispara a notificação oficial.
    """

    name: str = "register_demand"
    description: str = (
        "Registra formalmente uma demanda no banco de dados relacional municipal e gera protocolo único. "
        "Requer aprovação prévia do cidadão (Human-in-the-Loop)."
    )

    @classmethod
    async def execute(
        cls,
        db: AsyncSession,
        payload: RegisterDemandInput,
        citizen: User
    ) -> ToolExecutionResult:
        """Executa a ferramenta sob autorização explícita do cidadão."""
        from src.services.demand_service import DemandService

        logger.info(f"[Tool: {cls.name}] Executando registro sob autorização do usuário ID={citizen.id}")
        create_data = DemandCreate(title=payload.title, description=payload.description)
        demand = await DemandService.create_demand(db=db, data=create_data, citizen=citizen)

        return ToolExecutionResult(
            success=True,
            protocol=demand.protocol,
            severity=demand.severity.value if demand.severity else "MEDIA",
            severity_justification=demand.severity_justification,
            message="Demanda registrada com sucesso no banco de dados após aprovação humana.",
            demand=DemandResponse.model_validate(demand)
        )
