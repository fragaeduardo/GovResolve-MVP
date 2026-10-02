from typing import List, Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.db.schema import User
from src.api.schemas import DemandCreate, DemandResponse, FeedbackCreate, FeedbackResponse
from src.api.dependencies import get_current_user
from src.services.demand_service import DemandService
from src.ai.service import AIScreeningService, ChatMessage, ChatAgentResponse

router = APIRouter(prefix="/demands", tags=["Demandas e Chatbot de Atendimento"])


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


@router.post("/chat", response_model=ChatAgentResponse)
async def chat_with_agent(
    req: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Chatbot conversacional de atendimento ao cidadão com agentes inteligentes e LLM (OmniRoute com fallback multi-modelo).
    Acolhe o cidadão, elicita informações faltantes e organiza a demanda para o órgão competente.
    """
    return await AIScreeningService.process_citizen_chat(req.messages)


@router.post("", response_model=DemandResponse, status_code=status.HTTP_201_CREATED)
async def create_new_demand(
    data: DemandCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Registra uma nova demanda pelo cidadão autenticado (RF002).
    Gera protocolo único imediato em menos de 3s (RF003, RNF003) e dispara triagem por IA.
    """
    demand = await DemandService.create_demand(db, data, current_user)
    return demand


@router.get("/my", response_model=List[DemandResponse])
async def list_my_demands(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lista todas as demandas registradas pelo cidadão autenticado (RF004)."""
    return await DemandService.list_citizen_demands(db, current_user.id)


@router.get("/{protocol}", response_model=DemandResponse)
async def get_demand_by_protocol(
    protocol: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Consulta o andamento de uma demanda pelo número do protocolo (RF004).
    Garante que cidadãos só visualizem demandas autorizadas (RF013, RNF001).
    """
    return await DemandService.get_demand_by_protocol(db, protocol, current_user)


@router.post("/{protocol}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_demand_feedback(
    protocol: str,
    feedback_data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Registra avaliação e feedback do cidadão após a conclusão do atendimento (RF015, HU013).
    """
    return await DemandService.add_feedback(db, protocol, feedback_data, current_user)
