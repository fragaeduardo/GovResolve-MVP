import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from src.db.engine import Base


class UserRole(str, enum.Enum):
    CIDADAO = "cidadao"
    SERVIDOR = "servidor"
    GESTOR = "gestor"


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


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    email = Column(String(255), nullable=False)

    demands = relationship("Demand", back_populates="department")


class Demand(Base):
    __tablename__ = "demands"

    id = Column(Integer, primary_key=True, index=True)
    protocol = Column(String(30), unique=True, index=True, nullable=False)
    chat_session_id = Column(String(64), unique=True, nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    status = Column(Enum(DemandStatus), default=DemandStatus.ABERTO, nullable=False)
    severity = Column(Enum(DemandSeverity), default=DemandSeverity.MEDIA, nullable=False)
    severity_justification = Column(Text, nullable=True)
    service_type = Column(Enum(ServiceType), nullable=True)
    category = Column(String(100), nullable=True)
    organized_summary = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    citizen = relationship("User", back_populates="demands", foreign_keys=[citizen_id])
    department = relationship("Department", back_populates="demands")
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
