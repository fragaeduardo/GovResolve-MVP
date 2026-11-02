"""
Módulo de Agentes Inteligentes do GovResolve.
Arquitetura Multiagente:
1. Planner / PlannerAgent: Orquestrador e coordenador central do pipeline.
2. DepartmentRoutingAgent: Classificação contextual de intenção e seleção de opções cadastradas.
3. RequirementsAgent: Reconhecimento estrito de saudações por compatibilidade.
4. ConversationalAgent: Acolhimento e diálogo natural com o cidadão.
5. DeterministicStateCollector: Coletor dos dados fornecidos na ficha de reclamação.
6. ConfirmationAgent: Fechamento Human-in-the-Loop pré-geração de protocolo.
7. FormalizationAgent: Formalização e execução de persistência via Tools.
8. SeverityClassificationAgent: Classificação contextual de gravidade operacional.
"""
from src.ai.agents.planner import Planner, PlannerAgent, MultiAgentOrchestrator
from src.ai.agents.department_routing_agent import DepartmentRoutingAgent
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
    "DepartmentRoutingAgent",
    "RequirementsAgent",
    "SlotMappingAgent",
    "ConversationalAgent",
    "DeterministicStateCollector",
    "ConfirmationAgent",
    "FormalizationAgent",
    "FormalizationResult",
    "SeverityClassificationAgent"
]
