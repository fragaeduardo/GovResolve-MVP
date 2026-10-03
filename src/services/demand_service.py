import random
import string
from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy import select, case, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db.schema import Demand, DemandSeverity, DemandStatus, Department, Feedback, ServiceType, StatusHistory, User, UserRole
from src.api.schemas import DemandCreate, DemandStatusUpdate, FeedbackCreate
from src.ai.service import AIScreeningService
from src.ai.agents.severity_agent import SeverityClassificationAgent
from src.services.notification_service import NotificationService


class DemandService:
    @staticmethod
    def generate_protocol() -> str:
        """Gera protocolo único no formato GR-YYYYMMDD-XXXX (RF003)."""
        date_str = datetime.utcnow().strftime("%Y%m%d")
        random_suffix = "".join(random.choices(string.digits + string.ascii_uppercase, k=5))
        return f"GR-{date_str}-{random_suffix}"

    @classmethod
    async def create_demand(
        cls,
        db: AsyncSession,
        data: DemandCreate,
        citizen: User
    ) -> Demand:
        """
        Cria nova demanda em conformidade com RF002, RF003, RF006, RF008 e RNF003 (<3s).
        """
        # 1. Geração de protocolo único
        protocol = cls.generate_protocol()
        while True:
            existing = await db.execute(select(Demand).where(Demand.protocol == protocol))
            if not existing.scalar_one_or_none():
                break
            protocol = cls.generate_protocol()

        # 2. Resolução de metadados (usa dados fornecidos pelo agente ou realiza triagem automática)
        dept_id = data.department_id
        severity = data.severity
        severity_justification = data.severity_justification
        category = data.category
        service_type = data.service_type
        organized_summary = data.organized_summary

        if not dept_id or not severity or not category:
            screening = await AIScreeningService.screen_demand(data.title, data.description)
            if not category:
                category = screening.category
            if not service_type:
                service_type = screening.service_type
            if not organized_summary:
                organized_summary = screening.organized_summary

            if not dept_id and screening.department_name:
                dept_res = await db.execute(
                    select(Department).where(Department.name.ilike(f"%{screening.department_name}%"))
                )
                dept = dept_res.scalars().first()
                if dept:
                    dept_id = dept.id

            if not severity:
                severity_result = await SeverityClassificationAgent.classify_demand(
                    title=data.title,
                    description=data.description,
                    category=category,
                    department_name=screening.department_name
                )
                severity = severity_result.severity
                severity_justification = severity_result.severity_justification

        if not dept_id:
            first_dept = await db.execute(select(Department))
            default_dept = first_dept.scalars().first()
            if default_dept:
                dept_id = default_dept.id

        if not severity:
            severity = DemandSeverity.MEDIA

        # 5. Criação do registro
        demand = Demand(
            protocol=protocol,
            title=data.title,
            description=data.description,
            citizen_id=citizen.id,
            department_id=dept_id,
            status=DemandStatus.ABERTO,
            severity=severity,
            severity_justification=severity_justification,
            service_type=service_type or ServiceType.ATENDIMENTO_PUBLICO,
            category=category or "Atendimento Geral",
            organized_summary=organized_summary
        )

        db.add(demand)
        await db.flush()

        # 6. Registro no histórico de status
        history = StatusHistory(
            demand_id=demand.id,
            old_status=None,
            new_status=DemandStatus.ABERTO,
            changed_by_id=citizen.id,
            notes="Demanda registrada pelo cidadão após aprovação no atendimento inteligente."
        )
        db.add(history)
        await db.commit()
        await db.refresh(demand)

        # 7. Notificação inicial por e-mail com indicação de gravidade (RF005, RNF005, RF016)
        await NotificationService.send_status_update_notification(
            to_email=citizen.email,
            protocol=demand.protocol,
            demand_title=demand.title,
            old_status=None,
            new_status=DemandStatus.ABERTO.value,
            severity=demand.severity.value
        )

        return demand

    @classmethod
    async def get_demand_by_protocol(
        cls,
        db: AsyncSession,
        protocol: str,
        user: Optional[User] = None
    ) -> Demand:
        """
        Consulta demanda por protocolo com verificação de autorização (RF004, RF013, RNF001).
        """
        stmt = (
            select(Demand)
            .where(Demand.protocol == protocol)
            .options(
                selectinload(Demand.citizen),
                selectinload(Demand.department),
                selectinload(Demand.history),
                selectinload(Demand.feedback)
            )
        )
        result = await db.execute(stmt)
        demand = result.scalar_one_or_none()

        if not demand:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Demanda com protocolo '{protocol}' não encontrada."
            )

        # Validação de acesso (RNF001): cidadão só acessa demandas próprias
        if user and user.role == UserRole.CIDADAO and demand.citizen_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso não autorizado aos dados desta demanda."
            )

        return demand

    @classmethod
    async def list_citizen_demands(
        cls,
        db: AsyncSession,
        citizen_id: int
    ) -> List[Demand]:
        """Lista demandas do cidadão autenticado (RF004)."""
        stmt = (
            select(Demand)
            .where(Demand.citizen_id == citizen_id)
            .order_by(Demand.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @classmethod
    async def list_department_demands(
        cls,
        db: AsyncSession,
        department_id: Optional[int] = None,
        status_filter: Optional[DemandStatus] = None,
        severity_filter: Optional[DemandSeverity] = None,
        order_by_priority: bool = False,
        search: Optional[str] = None
    ) -> List[Demand]:
        """Consulta demandas para o servidor público com filtros, busca e ordenação por prioridade (RF011, RF016)."""
        stmt = select(Demand)

        if department_id:
            stmt = stmt.where(Demand.department_id == department_id)
        if status_filter:
            stmt = stmt.where(Demand.status == status_filter)
        if severity_filter:
            stmt = stmt.where(Demand.severity == severity_filter)
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Demand.protocol.ilike(term),
                    Demand.title.ilike(term),
                    Demand.description.ilike(term)
                )
            )

        if order_by_priority:
            priority_rank = case(
                (Demand.severity == DemandSeverity.CRITICA, 1),
                (Demand.severity == DemandSeverity.ALTA, 2),
                (Demand.severity == DemandSeverity.MEDIA, 3),
                (Demand.severity == DemandSeverity.BAIXA, 4),
                else_=5
            )
            stmt = stmt.order_by(priority_rank.asc(), Demand.created_at.desc())
        else:
            stmt = stmt.order_by(Demand.created_at.desc())

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @classmethod
    async def update_status(
        cls,
        db: AsyncSession,
        protocol: str,
        update_data: DemandStatusUpdate,
        server_user: User
    ) -> Demand:
        """
        Atualiza o status da demanda respeitando estritamente o fluxo:
        ABERTO → EM ANDAMENTO → FECHADO (RF012, RF013, RF014).
        """
        if server_user.role not in [UserRole.SERVIDOR, UserRole.GESTOR]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas servidores ou gestores públicos autorizados podem alterar o status (RF013)."
            )

        demand = await cls.get_demand_by_protocol(db, protocol)
        current_status = demand.status
        next_status = update_data.new_status

        # Validação estrita da máquina de estados (RF012)
        valid_transitions = {
            DemandStatus.ABERTO: [DemandStatus.EM_ANDAMENTO],
            DemandStatus.EM_ANDAMENTO: [DemandStatus.FECHADO],
            DemandStatus.FECHADO: []
        }

        if next_status not in valid_transitions.get(current_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Transição inválida: Não é permitido alterar de '{current_status.value}' "
                    f"para '{next_status.value}'. Fluxo permitido: ABERTO → EM ANDAMENTO → FECHADO."
                )
            )

        # Validação obrigatória do parecer de encerramento (RF014)
        if next_status == DemandStatus.FECHADO:
            if not update_data.resolution_notes or not update_data.resolution_notes.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Para concluir e fechar a demanda, é obrigatório registrar o parecer do atendimento (RF014)."
                )
            demand.resolution_notes = update_data.resolution_notes.strip()

        # Atualiza a demanda
        old_status_val = demand.status.value
        demand.status = next_status
        demand.updated_at = datetime.utcnow()

        # Registra histórico
        history_entry = StatusHistory(
            demand_id=demand.id,
            old_status=current_status,
            new_status=next_status,
            changed_by_id=server_user.id,
            notes=update_data.notes or f"Status atualizado para {next_status.value}."
        )
        db.add(history_entry)
        await db.commit()
        await db.refresh(demand)

        # Envia notificação por e-mail ao cidadão (RF005, RNF005)
        citizen_res = await db.execute(select(User).where(User.id == demand.citizen_id))
        citizen = citizen_res.scalar_one_or_none()
        if citizen:
            await NotificationService.send_status_update_notification(
                to_email=citizen.email,
                protocol=demand.protocol,
                demand_title=demand.title,
                old_status=old_status_val,
                new_status=next_status.value,
                resolution_notes=demand.resolution_notes
            )

        return demand

    @classmethod
    async def add_feedback(
        cls,
        db: AsyncSession,
        protocol: str,
        data: FeedbackCreate,
        citizen: User
    ) -> Feedback:
        """
        Registra feedback sobre o atendimento recebido (RF015, HU013).
        """
        demand = await cls.get_demand_by_protocol(db, protocol, user=citizen)

        if demand.status != DemandStatus.FECHADO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A avaliação só pode ser realizada após o fechamento da demanda."
            )

        # Verifica se já existe feedback
        existing = await db.execute(select(Feedback).where(Feedback.demand_id == demand.id))
        feedback = existing.scalar_one_or_none()

        if feedback:
            feedback.rating = data.rating
            feedback.comment = data.comment
        else:
            feedback = Feedback(
                demand_id=demand.id,
                citizen_id=citizen.id,
                rating=data.rating,
                comment=data.comment
            )
            db.add(feedback)

        await db.commit()
        await db.refresh(feedback)
        return feedback
