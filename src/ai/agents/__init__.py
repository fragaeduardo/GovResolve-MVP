"""
Módulo de Agentes Inteligentes do GovResolve.
Arquitetura Multiagente:
1. ConversationalAgent: Acolhimento e diálogo natural empático.
2. SlotMappingAgent: Mapeador de requisitos (acionado 1x por demanda).
3. DeterministicStateCollector: Coletor e extrator determinístico de slots.
4. ConfirmationAgent: Fechamento Human-in-the-Loop pré-geração de protocolo.
5. SeverityClassificationAgent: Classificação de gravidade operacional pós-aprovação humana.
"""
from src.ai.agents.conversational_agent import ConversationalAgent
from src.ai.agents.slot_mapper import SlotMappingAgent
from src.ai.agents.state_collector import DeterministicStateCollector
from src.ai.agents.confirmation_agent import ConfirmationAgent
from src.ai.agents.severity_agent import SeverityClassificationAgent
