import json
import logging
from typing import List, Dict, Any, Optional
from src.ai.agents.session_store import SessionStore, AgentSession
from src.ai.agents.requirements_agent import RequirementsAgent
from src.ai.agents.state_collector import DeterministicStateCollector
from src.ai.agents.conversational_agent import ConversationalAgent
from src.ai.agents.confirmation_agent import ConfirmationAgent
from src.ai.agents.department_routing_agent import DepartmentRoutingAgent
from src.db.schema import ServiceType
from fastapi import HTTPException

logger = logging.getLogger("govresolve.ai.planner")


class Planner:
    """
    Planner Central Multiagente do GovResolve (antigo Orchestrator).
    Coordena a execução determinística da cadeia de agentes especialistas:
    
    1. DepartmentRoutingAgent:
       Distingue orientação de reclamação; só sugere o órgão quando a ficha estiver completa.
    2. DeterministicStateCollector (Coletor de Estado da Demanda):
       Atualiza a 'ficha de reclamação' extraindo dados factuais reais (endereço, bairro, referência)
       das mensagens do cidadão.
    3. ConversationalAgent (Agente Conversacional):
       Solicita de forma cordial e natural as informações pendentes.
    4. ConfirmationAgent (Human-in-the-Loop Review Gate):
       Apresenta a ficha e o órgão sugerido; recusas retornam à conversa para revisão.
    5. FormalizationAgent (Formalização e Execução de Tools):
       Acionado após a aprovação humana para formalizar o destino, classificar a gravidade
       e executar a tool de registro oficial no banco de dados.
    """

    @classmethod
    async def process_turn(
        cls,
        conversation: List[Dict[str, str]],
        session_id: Optional[str] = None,
        registered_departments: Optional[List[Dict[str, str]]] = None,
        owner_id: Optional[int] = None
    ) -> Dict[str, Any]:
        session = SessionStore.get_or_create(session_id, owner_id=owner_id)
        if not conversation or conversation[-1].get("role") != "user":
            raise HTTPException(status_code=422, detail="Envie uma mensagem do cidadão.")
        if session.registered_protocol or session.formalized_protocol:
            return {"reply": f"Solicitação já registrada: {session.registered_protocol or session.formalized_protocol}.",
                    "ready_to_register": False, "session_id": session.session_id, "missing_slots": [], "state": "FORMALIZED"}
        if session.state == "CANCELLED":
            raise HTTPException(status_code=409, detail="Atendimento cancelado. Inicie uma nova conversa.")
        session.messages.append({"role": "user", "content": conversation[-1]["content"]})
        conversation = session.messages
        session.is_ready_to_register = False
        session.approved_title = None
        session.approved_description = None

        # Histórico de mensagens do cidadão
        user_msgs = [m["content"] for m in conversation if m.get("role") == "user"]
        last_user_input = user_msgs[-1] if user_msgs else ""

        logger.info(f"[Planner] Processando turno da sessão {session.session_id} - Entrada: '{last_user_input}'")

        was_awaiting_confirmation = session.state == "AWAITING_CONFIRMATION"
        pending_slots_before = session.get_missing_mandatory_slots() if session.topic_identified else []
        slots_before = dict(session.collected_slots)
        precollected_current_turn = False
        previous_topic = ({
            "type": "reclamação em elaboração",
            "summary": session.topic_summary,
            "state": session.state,
            "department": session.department_name,
            "category": session.category,
            "collected_slots": slots_before,
            "pending_slots": pending_slots_before,
            "remaining_slots": pending_slots_before,
            "proposal": session.current_proposal,
        } if session.topic_identified else None)
        context = "\n".join(f"{m['role']}: {m['content']}" for m in conversation[-8:])
        if was_awaiting_confirmation:
            route = {"intent": "REVISION"}
        elif RequirementsAgent.is_pure_greeting(last_user_input):
            route = {"intent": "GREETING"}
        else:
            route = await DepartmentRoutingAgent.route(
                last_user_input, registered_departments, intent_only=True,
                previous_topic=previous_topic, conversation_context=context,
            )

        starts_new_topic = route.get("intent") == "TOPIC_SWITCH" and session.topic_identified
        if starts_new_topic:
            route = {"intent": "PUBLIC_COMPLAINT", "new_topic": True}

        if (
            session.topic_identified and pending_slots_before and not was_awaiting_confirmation
            and not starts_new_topic and route["intent"] != "SELF_SERVICE"
        ):
            # Route against the saved topic before collecting this message's address fields.
            DeterministicStateCollector.collect(session)
            precollected_current_turn = True
        answered_slots = [
            slot for slot in pending_slots_before
            if session.collected_slots.get(slot, "").strip()
            and session.collected_slots.get(slot) != slots_before.get(slot)
        ]
        if answered_slots and route.get("intent") in {"UNCLEAR", "PUBLIC_COMPLAINT"}:
            logger.info("[Planner] Resposta preencheu campos pendentes; mantendo o tópico ativo.")
            route = {"intent": "CONTINUATION"}

        # Saudação é tratada apenas quando a IA identifica a intenção no contexto.
        if route["intent"] == "GREETING" and not session.topic_identified:
            logger.info("[Planner] Saudação identificada sem tema prévio. Acionando ConversationalAgent...")
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

        # Orientação de autoatendimento é escolhida semanticamente e vem do catálogo curado.
        if route["intent"] == "SELF_SERVICE":
            service = route["service"]
            session.is_self_service = True
            session.topic_summary = None
            session.service_type = "AUTOATENDIMENTO"
            session.self_service_link = service["link"]
            session.self_service_instructions = service["instructions"]
            department = route["department"]
            category = service["name"]
            reply = (
                f"Esse pedido parece ser sobre {category}. Você pode seguir as instruções abaixo no portal oficial. "
                "Se o problema for outro ou o serviço não resolver sua situação, me conte para eu avaliar o registro de uma reclamação."
            )
            session.messages.append({"role": "assistant", "content": reply})
            SessionStore.save(session)
            return {
                "reply": reply,
                "ready_to_register": False,
                "service_type": ServiceType.AUTOATENDIMENTO,
                "category": category,
                "department_name": department["name"],
                "suggested_title": f"Autoatendimento: {category}",
                "suggested_description": f"Solicitação autônoma orientada pelo assistente: {last_user_input}",
                "self_service_link": service["link"],
                "self_service_instructions": service["instructions"],
                "session_id": session.session_id,
                "missing_slots": []
            }

        if route["intent"] == "HUMAN_REVIEW":
            session.topic_identified = True
            session.topic_summary = session.topic_summary or last_user_input
            session.is_self_service = False
            session.service_type = "ATENDIMENTO_PUBLICO"
            session.department_name = None
            session.category = "Aguardando triagem humana"
            session.problem_type = "manual_review"
            session.mandatory_slots = ["relato"]
        elif route["intent"] == "PUBLIC_COMPLAINT":
            if not session.topic_identified or session.is_self_service or route.get("new_topic"):
                session.topic_identified = True
                session.topic_summary = last_user_input
                session.topic_message_start = len(session.messages) - 1
                session.department_name = None
                session.department_id = None
                session.category = None
                session.problem_type = None
                session.mandatory_slots = ["logradouro", "bairro", "referencia"]
                session.optional_slots = ["detalhes"]
                session.service_type = "ATENDIMENTO_PUBLICO"
                session.is_self_service = False
                session.collected_slots = {}
                session.current_proposal = None
                session.proposal_id = None
                session.proposal_version = 1
                session.approved_proposal_version = None
                session.self_service_link = None
                session.self_service_instructions = None
                session.last_changed_fields = []
                session.state = "COLLECTING"
                precollected_current_turn = False
        elif route["intent"] in {"CONTINUATION", "REVISION"} and session.topic_identified:
            if was_awaiting_confirmation:
                session.proposal_version += 1
            if route["intent"] == "REVISION" or was_awaiting_confirmation:
                session.state = "REVISING"
                session.is_ready_to_register = False
                if session.problem_type != "manual_review":
                    session.department_name = None
                    session.category = None
                    session.problem_type = None
                session.current_proposal = None
        elif route["intent"] == "UNCLEAR" or not session.topic_identified:
            question = route.get("clarification") or "Pode explicar melhor se você quer registrar um problema ou receber orientação sobre um serviço?"
            reply = await ConversationalAgent.generate_clarification(session, last_user_input, question)
            session.messages.append({"role": "assistant", "content": reply})
            SessionStore.save(session)
            return {
                "reply": reply,
                "ready_to_register": False,
                "service_type": ServiceType.ATENDIMENTO_PUBLICO,
                "session_id": session.session_id,
                "missing_slots": [],
                "state": "COLLECTING",
            }

        # ETAPA 2: O Planner aciona o DeterministicStateCollector para consolidar os slots fornecidos
        logger.info("[Planner] Acionando DeterministicStateCollector para atualizar a ficha de reclamação...")
        if not precollected_current_turn:
            DeterministicStateCollector.collect(session)
        if user_msgs:
            session.collected_slots["relato"] = " | ".join(session.get_topic_user_messages())

        # ETAPA 3: O Planner verifica se a ficha de requisitos está completa
        missing_slots = session.get_missing_mandatory_slots()
        logger.info(f"[Planner] Status dos requisitos: coletados={list(session.collected_slots.keys())}, faltantes={missing_slots}")

        # ETAPA 4: Tomada de decisão do Planner
        if not missing_slots and session.problem_type == "manual_review":
            card = ConfirmationAgent.generate_confirmation(session)
            session.messages.append({"role": "assistant", "content": card.reply})
            SessionStore.save(session)
            return card.model_dump() | {"session_id": session.session_id, "service_type": "ATENDIMENTO_PUBLICO", "missing_slots": []}

        if not missing_slots:
            # A reclamação completa é roteada só agora, antes da revisão humana.
            sheet = {
                "relato": session.get_topic_user_messages(),
                "campos": session.collected_slots,
            }
            topic_context = "\n".join(
                f"{m['role']}: {m['content']}"
                for m in session.messages[session.topic_message_start:][-8:]
            )
            final_route = await DepartmentRoutingAgent.route(
                json.dumps(sheet, ensure_ascii=False), registered_departments,
                intent_only=False, previous_topic=None if starts_new_topic else previous_topic,
                conversation_context=topic_context,
            )
            if final_route.get("intent") != "PUBLIC_COMPLAINT":
                question = final_route.get("clarification") or "Ainda não consegui identificar o órgão mais adequado. Pode acrescentar algum detalhe sobre o problema?"
                reply = await ConversationalAgent.generate_clarification(session, last_user_input, question)
                if session.state != "REVISING":
                    session.state = "COLLECTING"
                session.messages.append({"role": "assistant", "content": reply})
                SessionStore.save(session)
                return {
                    "reply": reply,
                    "ready_to_register": False,
                    "service_type": ServiceType.ATENDIMENTO_PUBLICO,
                    "session_id": session.session_id,
                    "missing_slots": [],
                    "state": "COLLECTING",
                }

            session.department_name = final_route["department"]["name"]
            session.category = final_route["category"]
            session.problem_type = final_route["problem_type"]
            logger.info("[Planner] Ficha completa e órgão sugerido; preparando proposta para aprovação do cidadão.")
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
                "missing_slots": [],
                "state": card.state,
                "proposal": card.proposal,
                "proposal_version": card.proposal_version
            }

        # Ainda faltam requisitos: Acionar ConversationalAgent para solicitar educadamente os dados
        if session.state != "REVISING":
            session.state = "COLLECTING"
        logger.info(f"[Planner] Requisitos pendentes: {missing_slots}. Acionando ConversationalAgent...")
        next_question = await ConversationalAgent.generate_next_question(session, last_user_input, missing_slots)
        session.messages.append({"role": "assistant", "content": next_question})
        SessionStore.save(session)

        return {
            "reply": next_question,
            "ready_to_register": False,
            "service_type": ServiceType.ATENDIMENTO_PUBLICO,
            "category": session.category,
            "department_name": session.department_name,
            "session_id": session.session_id,
            "missing_slots": missing_slots,
            "state": session.state
        }


# Aliases para compatibilidade retroativa
PlannerAgent = Planner
MultiAgentOrchestrator = Planner
