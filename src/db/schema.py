import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum, Table
from sqlalchemy.orm import relationship
from src.db.engine import Base


class UserRole(str, enum.Enum):
    CIDADAO = "cidadao"
    SERVIDOR = "servidor"
    GESTOR = "gestor"


# Tabela associativa: vínculo de servidores aos departamentos que atendem (RBAC escopado)
user_departments = Table(
    "user_departments",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("department_id", Integer, ForeignKey("departments.id", ondelete="CASCADE"), primary_key=True)
)


class UserRoleAssignment(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False)

    user = relationship("User", back_populates="role_assignments")


class DemandStatus(str, enum.Enum):
    ABERTO = "ABERTO"
    EM_ANDAMENTO = "EM ANDAMENTO"
    FECHADO = "FECHADO"


class ServiceType(str, enum.Enum):
    AUTOATENDIMENTO = "AUTOATENDIMENTO"
    ATENDIMENTO_PUBLICO = "ATENDIMENTO_PUBLICO"


class DemandSeverity(str, enum.Enum):
    BAIXA = "BAIXA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    CRITICA = "CRITICA"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    cpf = Column(String(14), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CIDADAO, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    demands = relationship("Demand", back_populates="citizen", foreign_keys="Demand.citizen_id")
    feedbacks = relationship("Feedback", back_populates="citizen")
    role_assignments = relationship("UserRoleAssignment", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    departments = relationship("Department", secondary=user_departments, back_populates="users", lazy="selectin")

    def get_roles(self) -> list[UserRole]:
        roles_set = {self.role} if self.role else set()
        from sqlalchemy import inspect
        state = inspect(self)
        if "role_assignments" in state.dict and self.role_assignments:
            for ra in self.role_assignments:
                if ra and ra.role:
                    roles_set.add(ra.role)
        return list(roles_set)

    def has_role(self, role: UserRole) -> bool:
        return role in self.get_roles()

    def get_department_ids(self) -> list[int]:
        from sqlalchemy import inspect
        state = inspect(self)
        if "departments" in state.dict and self.departments:
            return [d.id for d in self.departments]
        return [self.department_id] if self.department_id is not None else []


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(24), unique=True, nullable=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    email = Column(String(255), nullable=False)

    demands = relationship("Demand", back_populates="department")
    users = relationship("User", secondary=user_departments, back_populates="departments")


class Demand(Base):
    __tablename__ = "demands"

    id = Column(Integer, primary_key=True, index=True)
    protocol = Column(String(30), unique=True, index=True, nullable=False)
    chat_session_id = Column(String(64), unique=True, nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    status = Column(Enum(DemandStatus), default=DemandStatus.EM_ANDAMENTO, nullable=False)
    severity = Column(Enum(DemandSeverity), default=DemandSeverity.MEDIA, nullable=False)
    severity_justification = Column(Text, nullable=True)
    service_type = Column(Enum(ServiceType), nullable=True)
    category = Column(String(100), nullable=True)
    organized_summary = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    citizen = relationship("User", back_populates="demands", foreign_keys=[citizen_id])
    department = relationship("Department", back_populates="demands", lazy="selectin")
    history = relationship("StatusHistory", back_populates="demand", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="demand", uselist=False)


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    demand_id = Column(Integer, ForeignKey("demands.id"), nullable=False)
    old_status = Column(Enum(DemandStatus), nullable=True)
    new_status = Column(Enum(DemandStatus), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    demand = relationship("Demand", back_populates="history")
    changed_by = relationship("User")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    demand_id = Column(Integer, ForeignKey("demands.id"), unique=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # ex: 1 a 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    demand = relationship("Demand", back_populates="feedback")
    citizen = relationship("User", back_populates="feedbacks")


class AgentSessionModel(Base):
    __tablename__ = "agent_sessions"

    session_id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    state = Column(String(30), default="COLLECTING", nullable=False)
    service_type = Column(String(30), default="ATENDIMENTO_PUBLICO", nullable=False)
    category = Column(String(100), nullable=True)
    department_name = Column(String(150), nullable=True)
    problem_type = Column(String(100), nullable=True)
    slots_json = Column(Text, default="{}", nullable=False)
    messages_json = Column(Text, default="[]", nullable=False)
    current_proposal_id = Column(String(64), nullable=True)
    current_proposal_version = Column(Integer, default=1, nullable=False)
    approved_proposal_version = Column(Integer, nullable=True)
    formalized_protocol = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    proposals = relationship("AgentProposalModel", back_populates="session", cascade="all, delete-orphan", lazy="selectin")


class AgentProposalModel(Base):
    __tablename__ = "agent_proposals"

    id = Column(String(64), primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("agent_sessions.session_id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department_name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    slots_json = Column(Text, default="{}", nullable=False)
    changed_fields_json = Column(Text, default="[]", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    session = relationship("AgentSessionModel", back_populates="proposals")
    department = relationship("Department")
