import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from src.config import settings


class AgentSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    messages: List[Dict[str, str]] = Field(default_factory=list)
    topic_identified: bool = False
    is_self_service: bool = False
    service_type: Optional[str] = "ATENDIMENTO_PUBLICO"
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    category: Optional[str] = None
    problem_type: Optional[str] = None
    mapped_slots: List[str] = Field(default_factory=list)
    mandatory_slots: List[str] = Field(default_factory=list)
    optional_slots: List[str] = Field(default_factory=list)
    collected_slots: Dict[str, str] = Field(default_factory=dict)
    self_service_link: Optional[str] = None
    self_service_instructions: Optional[str] = None
    is_ready_to_register: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def update_timestamp(self):
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def get_missing_mandatory_slots(self) -> List[str]:
        return [slot for slot in self.mandatory_slots if slot not in self.collected_slots or not self.collected_slots[slot].strip()]


class SessionStore:
    @classmethod
    def _get_file_path(cls, session_id: str) -> str:
        memory_dir = settings.AGENT_MEMORY_DIR
        os.makedirs(memory_dir, exist_ok=True)
        # Sanitizar session_id para evitar path traversal
        clean_id = "".join(c for c in session_id if c.isalnum() or c in ("-", "_"))
        return os.path.join(memory_dir, f"{clean_id}.json")

    @classmethod
    def get_or_create(cls, session_id: Optional[str] = None) -> AgentSession:
        if session_id:
            session = cls.load(session_id)
            if session:
                return session
            # Se não encontrado com esse id, cria com o ID fornecido
            session = AgentSession(session_id=session_id)
            cls.save(session)
            return session
        
        new_session = AgentSession()
        cls.save(new_session)
        return new_session

    @classmethod
    def load(cls, session_id: str) -> Optional[AgentSession]:
        file_path = cls._get_file_path(session_id)
        if not os.path.exists(file_path):
            return None
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return AgentSession(**data)
        except Exception:
            return None

    @classmethod
    def save(cls, session: AgentSession) -> None:
        session.update_timestamp()
        file_path = cls._get_file_path(session.session_id)
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(session.model_dump(), f, ensure_ascii=False, indent=2)
        except Exception as e:
            # Fallback seguro para não travar a aplicação caso haja restrição de disco
            pass
