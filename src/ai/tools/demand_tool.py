import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.schema import Demand, DemandSeverity, ServiceType, User
from src.api.schemas import DemandCreate, DemandResponse

logger = logging.getLogger("govresolve.ai.tools.demand")


class RegisterDemandInput(BaseModel):
    title: str = Field(..., description="Título resumido e estruturado da reclamação")
    description: str = Field(..., description="Descrição factual contendo logradouro, bairro, referência e detalhes")
    department_id: Optional[int] = Field(None, description="ID do departamento responsável")
    department_name: Optional[str] = Field(None, description="Nome do departamento responsável")
    severity: Optional[DemandSeverity] = Field(None, description="Nível de gravidade classificado pelo agente")
    severity_justification: Optional[str] = Field(None, description="Justificativa técnica da gravidade")
    category: Optional[str] = Field(None, description="Categoria do serviço")
    service_type: Optional[ServiceType] = Field(None, description="Tipo de serviço")
    organized_summary: Optional[str] = Field(None, description="Sumário factual organizado")


class ToolExecutionResult(BaseModel):
    success: bool
    protocol: Optional[str] = None
    department_name: Optional[str] = None
    severity: Optional[str] = None
    severity_justification: Optional[str] = None
    message: str
    demand: Optional[DemandResponse] = None


class DemandRegistrationTool:
    """
    Tool formal de Registro de Demanda no Banco de Dados Relacional.
    
    Padrão de Execução: Human-in-the-Loop Gated Tool
    - O agente prepara o payload da tool ('register_demand') após reunir todos os requisitos.
    - A ferramenta NÃO é executada autonomamente sem aprovação humana.
    - É acionada pelo FormalizationAgent após a aprovação explícita do cidadão no frontend.
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

        logger.info(f"[Tool: {cls.name}] Executando registro no banco de dados para o cidadão ID={citizen.id}")
        create_data = DemandCreate(
            title=payload.title,
            description=payload.description,
            department_id=payload.department_id,
            severity=payload.severity,
            severity_justification=payload.severity_justification,
            category=payload.category,
            service_type=payload.service_type,
            organized_summary=payload.organized_summary
        )
        demand = await DemandService.create_demand(db=db, data=create_data, citizen=citizen)

        dept_name = payload.department_name
        if not dept_name and demand.department:
            dept_name = demand.department.name

        return ToolExecutionResult(
            success=True,
            protocol=demand.protocol,
            department_name=dept_name,
            severity=demand.severity.value if demand.severity else "MEDIA",
            severity_justification=demand.severity_justification,
            message="Demanda registrada com sucesso no banco de dados após aprovação humana.",
            demand=DemandResponse.model_validate(demand)
        )
