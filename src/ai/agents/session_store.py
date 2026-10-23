import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional

from fastapi import HTTPException
from pydantic import BaseModel, Field

from src.config import settings

logger = logging.getLogger("govresolve.ai.session")


class AgentSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: Optional[int] = None
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
    approved_title: Optional[str] = None
    approved_description: Optional[str] = None
    registered_protocol: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def update_timestamp(self) -> None:
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def get_missing_mandatory_slots(self) -> List[str]:
        return [
            slot for slot in self.mandatory_slots
            if slot not in self.collected_slots or not self.collected_slots[slot].strip()
        ]


class SessionStore:
    @classmethod
    def _get_file_path(cls, session_id: str) -> str:
        # Rejeita IDs adulterados em vez de silenciosamente convertê-los.
        if not session_id or len(session_id) > 64 or any(
            not (ch.isalnum() or ch in "-_") for ch in session_id
        ):
            raise HTTPException(status_code=400, detail="Identificador da sessao invalido.")
        memory_dir = settings.AGENT_MEMORY_DIR
        os.makedirs(memory_dir, exist_ok=True)
        return os.path.join(memory_dir, f"{session_id}.json")

    @classmethod
    def get_or_create(
        cls, session_id: Optional[str] = None, owner_id: Optional[int] = None
    ) -> AgentSession:
        if session_id:
            session = cls.load(session_id)
            if session:
                if owner_id is not None and session.owner_id != owner_id:
                    raise HTTPException(status_code=403, detail="Sessao nao pertence ao usuario.")
                return session
            if owner_id is not None:
                raise HTTPException(status_code=404, detail="Sessao nao encontrada.")
            # Mantem compatibilidade com testes unitarios legados sem login.
            session = AgentSession(session_id=session_id)
        else:
            session = AgentSession(owner_id=owner_id)
        cls.save(session)
        return session

    @classmethod
    def load(cls, session_id: str) -> Optional[AgentSession]:
        file_path = cls._get_file_path(session_id)
        if not os.path.exists(file_path):
            return None
        try:
            with open(file_path, "r", encoding="utf-8") as file:
                return AgentSession.model_validate(json.load(file))
        except (ValueError, OSError) as exc:
            logger.error("Falha ao carregar sessao %s: %s", session_id, type(exc).__name__)
            raise HTTPException(status_code=500, detail="Sessao indisponivel.")

    @classmethod
    def save(cls, session: AgentSession) -> None:
        session.update_timestamp()
        file_path = cls._get_file_path(session.session_id)
        temporary_path = f"{file_path}.{uuid.uuid4().hex}.tmp"
        try:
            with open(temporary_path, "w", encoding="utf-8") as file:
                json.dump(session.model_dump(), file, ensure_ascii=False, indent=2)
            os.replace(temporary_path, file_path)
        finally:
            if os.path.exists(temporary_path):
                os.unlink(temporary_path)
