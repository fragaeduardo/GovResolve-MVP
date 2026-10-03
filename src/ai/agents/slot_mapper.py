"""
Re-export para compatibilidade retroativa com código existente.
Prefira importar diretamente de `src.ai.agents.requirements_agent`.
"""
from src.ai.agents.requirements_agent import (
    RequirementsAgent,
    RequirementsResult,
    SlotMappingAgent,
    SlotMappingResult
)

__all__ = [
    "RequirementsAgent",
    "RequirementsResult",
    "SlotMappingAgent",
    "SlotMappingResult"
]
