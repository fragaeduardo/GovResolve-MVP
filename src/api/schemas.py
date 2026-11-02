import enum
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from src.db.schema import DemandSeverity, DemandStatus, ServiceType, UserRole


# Estados da Máquina de Conversação (HITL)
class ConversationState(str, enum.Enum):
    COLLECTING = "COLLECTING"
    AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION"
    REVISING = "REVISING"
    APPROVED = "APPROVED"
    FORMALIZED = "FORMALIZED"
    CANCELLED = "CANCELLED"


# Auth & RBAC Schemas
class AreaAuthorization(BaseModel):
    authorized: bool


class UserAreas(BaseModel):
    citizen: AreaAuthorization
    server: AreaAuthorization
    management: AreaAuthorization


class DepartmentRef(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    cpf: str = Field(..., max_length=14, description="CPF do usuário")
    name: str = Field(..., max_length=255)
    email: EmailStr
    role: UserRole = UserRole.CIDADAO


class UserResponse(UserBase):
    department_id: Optional[int] = None
    id: int
    roles: List[UserRole] = []
    areas: Optional[UserAreas] = None
    departments: List[DepartmentRef] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# HITL Propostas e Chatbot
class ProposalDepartment(BaseModel):
    id: Optional[int] = None
    name: str


class ProposalDTO(BaseModel):
    id: str
    version: int = 1
    department: ProposalDepartment
    category: str
    title: str
    description: str
    slots: Dict[str, str] = Field(default_factory=dict)
    changed_fields: Optional[List[str]] = None
    created_at: Optional[datetime] = None


class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str


class ChatRevisionRequest(BaseModel):
    proposal_version: Optional[int] = None
    message: Optional[str] = None
    instructions: Optional[str] = None
    slots: Optional[Dict[str, Any]] = None


class ChatConfirmRequest(BaseModel):
    proposal_id: Optional[str] = None
    proposal_version: Optional[int] = None
    approved_proposal_version: Optional[int] = None


class ChatCancelResponse(BaseModel):
    success: bool
    session_id: str
    state: str
    message: str
    cancelled: bool = True


class ChatAgentResponse(BaseModel):
    reply: str
    ready_to_register: bool = False
    service_type: Optional[ServiceType] = None
    category: Optional[str] = None
    department_name: Optional[str] = None
    suggested_title: Optional[str] = None
    suggested_description: Optional[str] = None
    self_service_link: Optional[str] = None
    self_service_instructions: Optional[str] = None
    session_id: Optional[str] = None
    missing_slots: List[str] = []
    state: ConversationState = ConversationState.COLLECTING
    proposal: Optional[ProposalDTO] = None
    proposal_version: Optional[int] = None


class ChatSessionStateResponse(BaseModel):
    session_id: str
    state: ConversationState
    messages: List[ChatMessage] = []
    proposal: Optional[ProposalDTO] = None
    missing_slots: List[str] = []
    is_self_service: bool = False
    service_type: Optional[ServiceType] = None
    department_name: Optional[str] = None
    category: Optional[str] = None


# Demanda Schemas Básicos
class DemandCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, description="Título resumido da solicitação")
    description: str = Field(..., min_length=15, description="Descrição detalhada dos fatos")
    department_id: Optional[int] = Field(None, description="ID do departamento municipal competente")
    severity: Optional[DemandSeverity] = Field(None, description="Gravidade operacional pré-classificada")
    severity_justification: Optional[str] = Field(None, description="Justificativa da gravidade")
    service_type: Optional[ServiceType] = Field(None, description="Tipo de serviço")
    category: Optional[str] = Field(None, description="Categoria do serviço")
    organized_summary: Optional[str] = Field(None, description="Resumo factual estruturado")


class DemandResponse(BaseModel):
    department: Optional[DepartmentRef] = None
    id: int
    protocol: str
    title: str
    description: str
    status: DemandStatus
    severity: DemandSeverity = DemandSeverity.MEDIA
    severity_justification: Optional[str] = None
    service_type: Optional[ServiceType] = None
    category: Optional[str] = None
    organized_summary: Optional[str] = None
    resolution_notes: Optional[str] = None
    department_id: Optional[int] = None
    citizen_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DemandStatusUpdate(BaseModel):
    new_status: DemandStatus
    notes: Optional[str] = Field(None, max_length=1000, description="Andamento ou observação da alteração")
    resolution_notes: Optional[str] = Field(None, description="Obrigatório ao fechar a demanda (RF014)")


# Dossiê e Detalhamento da Demanda
class SeverityDetail(BaseModel):
    level: DemandSeverity
    justification: Optional[str] = None


class ClassificationDetail(BaseModel):
    category: Optional[str] = None
    service_type: Optional[ServiceType] = None


class DepartmentDetail(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None


class StatusHistoryDetail(BaseModel):
    from_status: Optional[str] = Field(None, alias="from")
    to_status: str = Field(..., alias="to")
    created_at: datetime
    notes: Optional[str] = None
    changed_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class FeedbackResponse(BaseModel):
    id: int
    demand_id: int
    citizen_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DemandDetailedResponse(BaseModel):
    id: int
    protocol: str
    title: str
    description: str
    status: DemandStatus
    severity: SeverityDetail
    classification: ClassificationDetail
    department: Optional[DepartmentDetail] = None
    organized_summary: Optional[str] = None
    history: List[StatusHistoryDetail] = []
    resolution_notes: Optional[str] = None
    feedback: Optional[FeedbackResponse] = None
    citizen_id: int
    citizen_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# Paginação
class PaginatedDemandsResponse(BaseModel):
    items: List[DemandResponse]
    page: int
    page_size: int
    total: int
    pages: Optional[int] = None


# Feedback Schema
class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Nota de avaliação de 1 a 5")
    comment: Optional[str] = Field(None, max_length=1000)


# Triagem e Autoatendimento (IA)
class AIScreeningResult(BaseModel):
    service_type: ServiceType
    category: str
    department_name: Optional[str] = None
    organized_summary: str
    self_service_link: Optional[str] = None
    self_service_instructions: Optional[str] = None


# Gestão e Indicadores (/management)
class ManagementStatusStats(BaseModel):
    aberto: int
    em_andamento: int
    fechado: int


class ManagementSeverityStats(BaseModel):
    critica: int
    alta: int
    media: int
    baixa: int


class ManagementOverviewResponse(BaseModel):
    total: int
    status: ManagementStatusStats
    severity: ManagementSeverityStats
    resolution_rate: float


class DepartmentComparisonResponse(BaseModel):
    department_id: int
    department_name: str
    email: Optional[str] = None
    total: int
    aberto: int
    em_andamento: int
    fechado: int
    critica: int
    alta: int
    media: int
    baixa: int
    resolution_rate: float
