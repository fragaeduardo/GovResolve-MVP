"""
Módulo de Agentes Inteligentes do GovResolve.
Arquitetura Multiagente:
1. Planner / PlannerAgent: Orquestrador e coordenador central do pipeline.
2. RequirementsAgent: Identificação de órgãos e requisitos/slots mandatórios da demanda.
3. ConversationalAgent: Acolhimento e diálogo natural empático com o cidadão.
4. DeterministicStateCollector: Coletor e extrator factual da ficha de reclamação.
5. ConfirmationAgent: Fechamento Human-in-the-Loop pré-geração de protocolo.
6. FormalizationAgent: Formalização de destino, classificação de gravidade e execução de persistência via Tools.
7. SeverityClassificationAgent: Especialista de classificação de gravidade operacional.
"""
from src.ai.agents.planner import Planner, PlannerAgent, MultiAgentOrchestrator
from src.ai.agents.requirements_agent import RequirementsAgent, SlotMappingAgent
from src.ai.agents.conversational_agent import ConversationalAgent
from src.ai.agents.state_collector import DeterministicStateCollector
from src.ai.agents.confirmation_agent import ConfirmationAgent
from src.ai.agents.formalization_agent import FormalizationAgent, FormalizationResult
from src.ai.agents.severity_agent import SeverityClassificationAgent

__all__ = [
    "Planner",
    "PlannerAgent",
    "MultiAgentOrchestrator",
    "RequirementsAgent",
    "SlotMappingAgent",
    "ConversationalAgent",
    "DeterministicStateCollector",
    "ConfirmationAgent",
    "FormalizationAgent",
    "FormalizationResult",
    "SeverityClassificationAgent"
]
