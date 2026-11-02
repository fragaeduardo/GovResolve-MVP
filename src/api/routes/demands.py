from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.db.schema import DemandStatus, Department, User, UserRole
from src.api.schemas import (
    ChatMessage,
    ChatAgentResponse,
    ChatRevisionRequest,
    ChatConfirmRequest,
    ChatCancelResponse,
    ChatSessionStateResponse,
    ProposalDTO,
    DemandCreate,
    DemandResponse,
    DemandDetailedResponse,
    PaginatedDemandsResponse,
    SeverityDetail,
    ClassificationDetail,
    DepartmentDetail,
    StatusHistoryDetail,
    FeedbackCreate,
    FeedbackResponse
)
from src.api.dependencies import get_current_user, require_role
from src.services.demand_service import DemandService
from src.ai.service import AIScreeningService
from src.ai.agents.session_store import SessionStore
from src.ai.agents.state_collector import DeterministicStateCollector
from src.ai.agents.confirmation_agent import ConfirmationAgent
from src.ai.agents.formalization_agent import FormalizationAgent

router = APIRouter(prefix="/demands", tags=["Demandas e Chatbot de Atendimento"])


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    session_id: Optional[str] = None


class ChatFormalizeRequest(BaseModel):
    session_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class ChatFormalizeResponse(BaseModel):
    success: bool
    protocol: str
    department_name: str
    category: str
    severity: str
    severity_justification: Optional[str] = None
    status: str
    title: str
    description: str
    reply: str
    demand: DemandResponse


@router.post("/chat", response_model=ChatAgentResponse)
async def chat_with_agent(
    req: ChatRequest,
    current_user: User = Depends(require_role([UserRole.CIDADAO])),
    db: AsyncSession = Depends(get_db)
):
    """
    Chatbot conversacional de atendimento ao cidadão com agentes inteligentes e LLM.
    Acolhe o cidadão, elicita requisitos faltantes e gera proposta formalizada quando completo.
    """
    result = await db.execute(select(Department).order_by(Department.name))
    registered_departments = [
        {"name": department.name, "description": department.description or ""}
        for department in result.scalars().all()
    ]
    return await AIScreeningService.process_citizen_chat(req.messages, req.session_id, registered_departments, owner_id=current_user.id)


@router.get("/chat/{session_id}", response_model=ChatSessionStateResponse)
async def get_chat_session(
    session_id: str,
    current_user: User = Depends(require_role([UserRole.CIDADAO]))
):
    """
    Restaura uma conversa em andamento: mensagens, estado da máquina e proposta pendente.
    """
    session = SessionStore.load(session_id)
    if session and session.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sessão pertence a outro cidadão.")
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sessão de atendimento '{session_id}' não encontrada."
        )

    proposal_dto = None
    if session.current_proposal:
        try:
            proposal_dto = ProposalDTO(**session.current_proposal)
        except Exception:
            pass

    return ChatSessionStateResponse(
        session_id=session.session_id,
        state=session.state,
        messages=[ChatMessage(role=m.get("role", "user"), content=m.get("content", "")) for m in session.messages],
        proposal=proposal_dto,
        missing_slots=session.get_missing_mandatory_slots(),
        is_self_service=session.is_self_service,
        service_type=session.service_type,
        department_name=session.department_name,
        category=session.category
    )


@router.post("/chat/{session_id}/revision", response_model=ChatAgentResponse)
async def revise_chat_proposal(
    session_id: str,
    req: ChatRevisionRequest,
    current_user: User = Depends(require_role([UserRole.CIDADAO]))
):
    """
    Entra no estado REVISING: aceita correções factuais do cidadão, sobrescreve slots
    determinísticos no StateCollector e gera uma nova versão de proposta (HITL).
    """
    session = SessionStore.load(session_id)
    if session and session.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sessão pertence a outro cidadão.")
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sessão '{session_id}' não encontrada."
        )

    revision_text = req.message or req.instructions or ""
    if req.slots:
        revision_text += "\n" + "\n".join(f"{key}: {value}" for key, value in req.slots.items())
    if not revision_text.strip():
        raise HTTPException(status_code=422, detail="Informe o que deseja corrigir.")
    if req.proposal_version is not None and req.proposal_version != session.proposal_version:
        raise HTTPException(status_code=409, detail="A ficha mudou. Revise a versão atual.")
    from src.ai.agents.planner import Planner
    return await Planner.process_turn([{"role": "user", "content": revision_text}], session_id, owner_id=current_user.id)


@router.post("/chat/{session_id}/confirm", response_model=ChatFormalizeResponse, status_code=status.HTTP_201_CREATED)
async def confirm_chat_proposal(
    session_id: str,
    req: Optional[ChatConfirmRequest] = None,
    current_user: User = Depends(require_role([UserRole.CIDADAO])),
    db: AsyncSession = Depends(get_db)
):
    """
    Confirma uma versão específica da proposta HITL e formaliza a autuação da demanda no banco relacional.
    Garante IDEMPOTÊNCIA: chamadas subsequentes com a mesma proposta retornam o protocolo já gerado.
    """
    session = SessionStore.load(session_id)
    if session and session.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sessão pertence a outro cidadão.")
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sessão '{session_id}' não encontrada."
        )


    prop_id = (req.proposal_id if req else None) or session.proposal_id or f"prop_{session_id}"
    prop_ver = (req.approved_proposal_version if req and req.approved_proposal_version is not None else (req.proposal_version if req else None)) or session.proposal_version

    result = await FormalizationAgent.formalize_and_register(
        db=db,
        citizen=current_user,
        session_id=session_id,
        proposal_id=prop_id,
        proposal_version=prop_ver
    )

    return ChatFormalizeResponse(
        success=result.success,
        protocol=result.protocol,
        department_name=result.department_name,
        category=result.category,
        severity=result.severity,
        severity_justification=result.severity_justification,
        status=result.status,
        title=result.title,
        description=result.description,
        reply=result.reply,
        demand=result.demand
    )


@router.post("/chat/{session_id}/cancel", response_model=ChatCancelResponse)
async def cancel_chat_demand(
    session_id: str,
    current_user: User = Depends(require_role([UserRole.CIDADAO]))
):
    """Cancela o fluxo de autuação antes da geração de protocolo oficial."""
    session = SessionStore.load(session_id)
    if session and session.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sessão pertence a outro cidadão.")
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sessão '{session_id}' não encontrada."
        )

    session.is_ready_to_register = False
    session.approved_title = None
    session.approved_description = None
    session.state = "CANCELLED"
    SessionStore.save(session)

    return ChatCancelResponse(
        success=True,
        session_id=session.session_id,
        state="CANCELLED",
        message="Solicitação cancelada com sucesso antes da autuação oficial."
    )


@router.post("/chat/formalize", response_model=ChatFormalizeResponse, status_code=status.HTTP_201_CREATED)
async def formalize_demand_chat(
    req: ChatFormalizeRequest,
    current_user: User = Depends(require_role([UserRole.CIDADAO])),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint de compatibilidade retroativa para formalização via Human-in-the-Loop.
    """
    result = await FormalizationAgent.formalize_and_register(
        db=db,
        citizen=current_user,
        session_id=req.session_id,
        title=req.title,
        description=req.description
    )
    return ChatFormalizeResponse(
        success=result.success,
        protocol=result.protocol,
        department_name=result.department_name,
        category=result.category,
        severity=result.severity,
        severity_justification=result.severity_justification,
        status=result.status,
        title=result.title,
        description=result.description,
        reply=result.reply,
        demand=result.demand
    )


@router.post("", response_model=DemandResponse, status_code=status.HTTP_201_CREATED)
async def create_new_demand(
    data: DemandCreate,
    current_user: User = Depends(require_role([UserRole.CIDADAO])),
    db: AsyncSession = Depends(get_db)
):
    """Registra uma nova demanda pelo cidadão autenticado (RF002)."""
    return await DemandService.create_demand(db, data, current_user)


@router.get("/my", response_model=Union[PaginatedDemandsResponse, List[DemandResponse]])
async def list_my_demands(
    status_filter: Optional[DemandStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    page: Optional[int] = Query(None),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role([UserRole.CIDADAO])),
    db: AsyncSession = Depends(get_db)
):
    """
    Lista demandas registradas pelo cidadão autenticado (RF004).
    Suporta filtros por status, busca textual e paginação opcional.
    """
    items, total = await DemandService.list_citizen_demands(
        db=db,
        citizen_id=current_user.id,
        status_filter=status_filter,
        search=search,
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


@router.get("/departments")
async def list_public_departments(db: AsyncSession = Depends(get_db)):
    """Lista todos os órgãos públicos e secretarias municipais cadastrados."""
    from src.db.schema import Department
    from sqlalchemy import select
    res = await db.execute(select(Department).order_by(Department.name))
    return [{"id": d.id, "name": d.name, "description": d.description, "email": d.email} for d in res.scalars().all()]


@router.get("/{protocol}", response_model=DemandDetailedResponse)
async def get_demand_by_protocol(
    protocol: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Consulta o andamento de uma demanda pelo protocolo com histórico completo (timeline), parecer e feedback.
    Garante que cidadãos só visualizem demandas autorizadas (RF004, RF013, RNF001).
    """
    demand = await DemandService.get_demand_by_protocol(db, protocol, current_user)

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


@router.post("/{protocol}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_demand_feedback(
    protocol: str,
    feedback_data: FeedbackCreate,
    current_user: User = Depends(require_role([UserRole.CIDADAO])),
    db: AsyncSession = Depends(get_db)
):
    """Registra avaliação e feedback do cidadão após a conclusão do atendimento (RF015, HU013)."""
    return await DemandService.add_feedback(db, protocol, feedback_data, current_user)
