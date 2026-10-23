import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from src.ai.agents.session_store import SessionStore, AgentSession
from src.ai.agents.requirements_agent import RequirementsAgent
from src.ai.agents.semantic_router import SemanticRoutingAgent
from src.ai.agents.state_collector import DeterministicStateCollector
from src.ai.agents.conversational_agent import ConversationalAgent
from src.ai.agents.confirmation_agent import ConfirmationAgent
from src.db.schema import ServiceType

logger = logging.getLogger("govresolve.ai.planner")


class Planner:
    """
    Planner Central Multiagente do GovResolve (antigo Orchestrator).
    Coordena a execução determinística da cadeia de agentes especialistas:
    
    1. RequirementsAgent (Agente de Requisitos):
       Mapeia a solicitação do cidadão, identifica o órgão municipal competente
       e define quais informações/requisitos (slots) são estritamente necessários.
    2. DeterministicStateCollector (Coletor de Estado da Demanda):
       Atualiza a 'ficha de reclamação' extraindo dados factuais reais (endereço, bairro, referência)
       das mensagens do cidadão.
    3. ConversationalAgent (Agente Conversacional):
       Munido dos requisitos apontados pelo RequirementsAgent, acolhe o cidadão cordialmente
       e solicita de forma empática e natural as informações pendentes.
    4. ConfirmationAgent (Human-in-the-Loop Review Gate):
       Quando a ficha de reclamação estiver com todos os requisitos preenchidos,
       elabora a proposta estruturada para revisão e aprovação explícita do cidadão.
    5. FormalizationAgent (Formalização e Execução de Tools):
       Acionado após a aprovação humana para formalizar o destino, classificar a gravidade
       e executar a tool de registro oficial no banco de dados.
    """

    @classmethod
    async def process_turn(
        cls,
        conversation: List[Dict[str, str]],
        session_id: Optional[str] = None,
        owner_id: Optional[int] = None
    ) -> Dict[str, Any]:
        session = SessionStore.get_or_create(session_id, owner_id=owner_id)
        if not conversation or conversation[-1].get("role") != "user":
            raise HTTPException(status_code=422, detail="Envie uma mensagem do cidadao.")
        if session.registered_protocol:
            return {
                "reply": f"Esta solicitacao ja foi registrada: {session.registered_protocol}.",
                "ready_to_register": False,
                "session_id": session.session_id,
                "missing_slots": []
            }
        # Nunca substituir memoria do servidor por mensagens historicas do cliente.
        session.messages.append({"role": "user", "content": conversation[-1]["content"]})
        session.is_ready_to_register = False
        session.approved_title = None
        session.approved_description = None

        # Histórico de mensagens do cidadão
        user_msgs = [m["content"] for m in session.messages if m.get("role") == "user"]
        last_user_input = user_msgs[-1] if user_msgs else ""
        full_user_context = " ".join(user_msgs)

        logger.info(f"[Planner] Processando turno da sessão {session.session_id} - Entrada: '{last_user_input}'")

        # ETAPA 1: O Planner consulta o RequirementsAgent para analisar a intenção e os requisitos da mensagem atual
        current_req = RequirementsAgent.analyze(last_user_input)
        if not current_req.topic_identified and not current_req.is_greeting_only and not session.topic_identified:
            semantic_req = await SemanticRoutingAgent.route(full_user_context)
            if semantic_req is not None:
                current_req = semantic_req

        # Caso A: Cidadão enviou apenas uma saudação inicial
        if current_req.is_greeting_only and not session.topic_identified:
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

        # Caso B: Cidadão solicitou Autoatendimento (IPTU, certidões, taxas)
        if current_req.is_self_service:
            logger.info(f"[Planner] Autoatendimento detectado para {current_req.department_name}.")
            session.topic_identified = True
            session.is_self_service = True
            session.service_type = "AUTOATENDIMENTO"
            session.department_name = current_req.department_name
            session.category = current_req.category
            session.problem_type = current_req.problem_type
            session.self_service_link = current_req.self_service_link
            session.self_service_instructions = current_req.self_service_instructions

            reply = (
                f"Identifiquei que sua solicitação refere-se a um serviço de Autoatendimento da {current_req.department_name}. "
                f"Você não precisa aguardar análise presencial; pode concluir o procedimento de forma autônoma e imediata pelo portal oficial."
            )
            session.messages.append({"role": "assistant", "content": reply})
            SessionStore.save(session)
            return {
                "reply": reply,
                "ready_to_register": False,
                "service_type": ServiceType.AUTOATENDIMENTO,
                "category": current_req.category,
                "department_name": current_req.department_name,
                "suggested_title": f"Autoatendimento: {current_req.category}",
                "suggested_description": f"Solicitação autônoma orientada pelo assistente: {last_user_input}",
                "self_service_link": current_req.self_service_link,
                "self_service_instructions": current_req.self_service_instructions,
                "session_id": session.session_id,
                "missing_slots": []
            }

        # Caso C: Mensagem atual introduz ou substitui o assunto de zeladoria pública
        if current_req.topic_identified and not current_req.is_greeting_only:
            # Novo tema ou transição de tópico durante a conversa
            if not session.topic_identified or (current_req.problem_type and current_req.problem_type != session.problem_type):
                logger.info(f"[Planner] RequirementsAgent identificou novo tema: {current_req.problem_type} -> Órgão: {current_req.department_name}")
                session.topic_identified = True
                session.department_name = current_req.department_name
                session.category = current_req.category
                session.problem_type = current_req.problem_type
                session.mandatory_slots = current_req.mandatory_slots
                session.optional_slots = current_req.optional_slots
                session.service_type = "ATENDIMENTO_PUBLICO"
                session.is_self_service = False
                session.collected_slots = {}  # Limpa slots anteriores para nova solicitação limpa
        elif not session.topic_identified:
            # Fallback se a primeira mensagem combinou saudação e descrição
            full_req = RequirementsAgent.analyze(full_user_context)
            if full_req.topic_identified and not full_req.is_greeting_only:
                logger.info(f"[Planner] Contexto consolidado identificou tema: {full_req.department_name}")
                session.topic_identified = True
                session.department_name = full_req.department_name
                session.category = full_req.category
                session.problem_type = full_req.problem_type
                session.mandatory_slots = full_req.mandatory_slots
                session.optional_slots = full_req.optional_slots
                session.service_type = "ATENDIMENTO_PUBLICO"
                session.is_self_service = False

        # Assunto desconhecido: nunca oferecer registro prematuro sem classificacao.
        if not session.topic_identified:
            reply = (
                "Pode me contar um pouco mais sobre o problema e o servico publico "
                "relacionado? Se preferir a avaliacao de uma pessoa, escreva "
                "\"encaminhar para ouvidoria\"."
            )
            session.messages.append({"role": "assistant", "content": reply})
            SessionStore.save(session)
            return {
                "reply": reply, "ready_to_register": False,
                "service_type": ServiceType.ATENDIMENTO_PUBLICO,
                "session_id": session.session_id, "missing_slots": ["tema"]
            }

        # ETAPA 2: O Planner aciona o DeterministicStateCollector para consolidar os slots fornecidos
        logger.info("[Planner] Acionando DeterministicStateCollector para atualizar a ficha de reclamação...")
        DeterministicStateCollector.collect(session)

        # ETAPA 3: O Planner verifica se a ficha de requisitos está completa
        missing_slots = session.get_missing_mandatory_slots()
        logger.info(f"[Planner] Status dos requisitos: coletados={list(session.collected_slots.keys())}, faltantes={missing_slots}")

        # ETAPA 4: Tomada de decisão do Planner
        if not missing_slots:
            # Todos os requisitos foram coletados: Acionar ConfirmationAgent (Human-in-the-Loop Gate)
            logger.info("[Planner] Todos os requisitos coletados! Submetendo à revisão humana via ConfirmationAgent...")
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

        # Ainda faltam requisitos: Acionar ConversationalAgent para solicitar educadamente os dados
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
            "missing_slots": missing_slots
        }


# Aliases para compatibilidade retroativa
PlannerAgent = Planner
MultiAgentOrchestrator = Planner
