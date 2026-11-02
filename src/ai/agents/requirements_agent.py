import re
from typing import List, Optional

from pydantic import BaseModel, Field


class RequirementsResult(BaseModel):
    is_greeting_only: bool = False
    topic_identified: bool = False
    is_self_service: bool = False
    service_type: str = "ATENDIMENTO_PUBLICO"
    department_name: Optional[str] = None
    category: Optional[str] = None
    problem_type: Optional[str] = None
    mandatory_slots: List[str] = Field(default_factory=list)
    optional_slots: List[str] = Field(default_factory=list)
    self_service_link: Optional[str] = None
    self_service_instructions: Optional[str] = None


class RequirementsAgent:
    """Mantém reconhecimento estrito de saudação; intenção é classificada por IA."""

    GREETINGS = {
        "oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", "e ai", "e aí",
        "opa", "alo", "alô", "tudo bem", "preciso de ajuda", "tem alguem ai", "tem alguém aí",
    }

    @classmethod
    def is_pure_greeting(cls, text: str) -> bool:
        cleaned = re.sub(r"[^\w\s]", "", text.strip().lower())
        return cleaned in cls.GREETINGS

    @classmethod
    def analyze(cls, user_text: str) -> RequirementsResult:
        # Compatibilidade para callers antigos; não classifica o conteúdo da mensagem.
        return RequirementsResult(is_greeting_only=cls.is_pure_greeting(user_text))


SlotMappingAgent = RequirementsAgent
SlotMappingResult = RequirementsResult
