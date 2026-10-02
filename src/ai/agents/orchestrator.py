import logging
from typing import List, Dict, Any, Optional
from src.ai.agents.session_store import SessionStore, AgentSession
from src.ai.agents.slot_mapper import SlotMappingAgent
from src.ai.agents.state_collector import DeterministicStateCollector
from src.ai.agents.conversational_agent import ConversationalAgent
from src.ai.agents.confirmation_agent import ConfirmationAgent
from src.db.schema import ServiceType

logger = logging.getLogger("govresolve.ai.orchestrator")


class MultiAgentOrchestrator:
    """
    Orquestrador Central Multiagente do GovResolve.
    Coordena os 4 agentes com persistência em disco:
    1. ConversationalAgent (Acolhimento & Diálogo)
    2. SlotMappingAgent (Mapeador de Requisitos - 1x por demanda)
    3. DeterministicStateCollector (Extrator e Coletor de Estado)
    4. ConfirmationAgent (Fechamento Human-in-the-Loop)
    """

    @classmethod
    async def process_turn(
        cls,
        conversation: List[Dict[str, str]],
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        session = SessionStore.get_or_create(session_id)
        session.messages = conversation

        # Mensagens do cidadão
        user_msgs = [m["content"] for m in conversation if m.get("role") == "user"]
        last_user_input = user_msgs[-1] if user_msgs else ""
        full_user_context = " ".join(user_msgs)

        # 1. Se ainda não mapeamos o tópico desta demanda, acionar o SlotMappingAgent (1x!)
        if not session.topic_identified:
            mapping = SlotMappingAgent.analyze(full_user_context)

            if mapping.is_greeting_only:
                reply = ConversationalAgent.generate_greeting_reply()
                session.messages.append({"role": "assistant", "content": reply})
                SessionStore.save(session)
                return {
                    "reply": reply,
                    "ready_to_register": False,
                    "service_type": ServiceType.ATENDIMENTO_PUBLICO,
                    "session_id": session.session_id,
                    "missing_slots": []
                }

            if mapping.is_self_service:
                session.topic_identified = True
                session.is_self_service = True
                session.service_type = "AUTOATENDIMENTO"
                session.department_name = mapping.department_name
                session.category = mapping.category
                session.self_service_link = mapping.self_service_link
                session.self_service_instructions = mapping.self_service_instructions

                reply = (
                    f"Identifiquei que sua solicitação refere-se a um serviço de Autoatendimento da {mapping.department_name}. "
                    f"Você não precisa aguardar análise presencial; pode concluir o procedimento de forma autônoma e imediata pelo portal oficial."
                )
                session.messages.append({"role": "assistant", "content": reply})
                SessionStore.save(session)
                return {
                    "reply": reply,
                    "ready_to_register": False,
                    "service_type": ServiceType.AUTOATENDIMENTO,
                    "category": mapping.category,
                    "department_name": mapping.department_name,
                    "suggested_title": f"Autoatendimento: {mapping.category}",
                    "suggested_description": f"Solicitação autônoma orientada pelo assistente: {last_user_input}",
                    "self_service_link": mapping.self_service_link,
                    "self_service_instructions": mapping.self_service_instructions,
                    "session_id": session.session_id,
                    "missing_slots": []
                }

            # Caso seja Zeladoria / Atendimento Público
            session.topic_identified = True
            session.department_name = mapping.department_name
            session.category = mapping.category
            session.problem_type = mapping.problem_type
            session.mandatory_slots = mapping.mandatory_slots
            session.optional_slots = mapping.optional_slots
            session.service_type = "ATENDIMENTO_PUBLICO"

        # 2. Executar o DeterministicStateCollector para extrair dados desta e de mensagens anteriores
        DeterministicStateCollector.collect(session)

        # 3. Avaliar se ainda faltam slots mandatórios
        missing_slots = session.get_missing_mandatory_slots()

        # 4. Decisão de transição: Human-in-the-Loop vs Conversação
        if not missing_slots:
            # Todos os dados necessários foram coletados! Acionar ConfirmationAgent
            card = ConfirmationAgent.generate_confirmation(session)
            session.messages.append({"role": "assistant", "content": card.reply})
            SessionStore.save(session)
            return {
                "reply": card.reply,
                "ready_to_register": True,
                "service_type": ServiceType.ATENDIMENTO_PUBLICO,
                "category": card.category,
                "department_name": card.department_name,
                "suggested_title": card.suggested_title,
                "suggested_description": card.suggested_description,
                "session_id": session.session_id,
                "missing_slots": []
            }

        # Ainda faltam slots: ConversationalAgent formula pergunta pontual
        next_question = ConversationalAgent.generate_next_question(session, missing_slots)
        session.messages.append({"role": "assistant", "content": next_question})
        SessionStore.save(session)

        return {
            "reply": next_question,
            "ready_to_register": False,
            "service_type": ServiceType.ATENDIMENTO_PUBLICO,
            "category": session.category,
            "department_name": session.department_name,
            "session_id": session.session_id,
            "missing_slots": missing_slots
        }
