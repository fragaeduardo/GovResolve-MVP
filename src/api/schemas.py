from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from src.db.schema import DemandSeverity, DemandStatus, ServiceType, UserRole


# Auth Schemas
class UserBase(BaseModel):
    cpf: str = Field(..., max_length=14, description="CPF do usuário")
    name: str = Field(..., max_length=255)
    email: EmailStr
    role: UserRole = UserRole.CIDADAO


class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Demanda Schemas
class DemandCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, description="Título resumido da solicitação")
    description: str = Field(..., min_length=15, description="Descrição detalhada dos fatos")


class DemandResponse(BaseModel):
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
    notes: Optional[str] = Field(None, description="Justificativa ou parecer da alteração")
    resolution_notes: Optional[str] = Field(None, description="Obrigatório ao fechar a demanda (RF014)")


# Feedback Schema
class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Nota de avaliação de 1 a 5")
    comment: Optional[str] = Field(None, max_length=1000)


class FeedbackResponse(BaseModel):
    id: int
    demand_id: int
    citizen_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Triagem e Autoatendimento (IA)
class AIScreeningResult(BaseModel):
    service_type: ServiceType
    category: str
    department_name: Optional[str] = None
    organized_summary: str
    self_service_link: Optional[str] = None
    self_service_instructions: Optional[str] = None
