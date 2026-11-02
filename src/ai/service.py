import logging
from typing import List, Dict, Any, Optional
import httpx
from src.config import settings
from src.api.schemas import AIScreeningResult
from src.db.schema import ServiceType

logger = logging.getLogger("govresolve.ai")


from src.api.schemas import ChatMessage, ChatAgentResponse, ConversationState, ProposalDTO



class AIScreeningService:
    @classmethod
    async def call_llm_with_fallback(cls, messages: List[Dict[str, str]], response_json: bool = True) -> Optional[str]:
        """
        Usa o provedor selecionado: OpenAI para uso efetivo ou OmniRoute para testes.
        """
        provider = settings.AI_PROVIDER.strip().lower()
        if provider == "openai":
            if settings.OPENAI_API_KEY:
                try:
                    payload = {
                        "model": settings.OPENAI_MODEL,
                        "messages": messages,
                        "reasoning_effort": "none"
                    }
                    if response_json:
                        payload["response_format"] = {"type": "json_object"}
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        resp = await client.post(
                            f"{settings.OPENAI_BASE_URL.rstrip('/')}/chat/completions",
                            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                            json=payload
                        )
                    resp.raise_for_status()
                    content = resp.json()["choices"][0]["message"]["content"]
                    if content:
                        return content
                    logger.warning("[IA OpenAI] Resposta vazia; tentando OmniRoute.")
                except Exception as e:
                    logger.warning(f"[IA OpenAI] Falha no modelo {settings.OPENAI_MODEL}; tentando OmniRoute: {e}")
            else:
                logger.warning("[IA OpenAI] OPENAI_API_KEY não configurada; tentando OmniRoute.")

        if provider in {"openai", "omniroute"}:
            if not settings.OMNIROUTE_API_KEY:
                logger.warning("[IA OmniRoute] OMNIROUTE_API_KEY não configurada.")
            else:
                headers = {
                    "Authorization": f"Bearer {settings.OMNIROUTE_API_KEY}",
                    "Content-Type": "application/json"
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    for model_name in settings.omniroute_model_list:
                        try:
                            payload = {
                                "model": model_name,
                                "messages": messages,
                                "temperature": 0.2,
                                "max_tokens": 512,
                            }
                            if model_name.startswith("ollama-local/"):
                                payload["reasoning_effort"] = "none"
                            if response_json:
                                payload["response_format"] = {"type": "json_object"}
                            resp = await client.post(
                                f"{settings.OMNIROUTE_BASE_URL}/chat/completions",
                                headers=headers,
                                json=payload,
                                timeout=60.0 if model_name.startswith("ollama-local/") else 10.0,
                            )
                            if resp.status_code == 200:
                                content = resp.json()["choices"][0]["message"]["content"]
                                if content:
                                    return content
                        except Exception as e:
                            logger.warning(f"[IA OmniRoute] Modelo {model_name} indisponível: {e}")

        # Gemini legado permanece como fallback quando configurado.
        if provider != "openai" and settings.GEMINI_API_KEY:
            try:
                from google import genai
                from google.genai import types
                client_gemini = genai.Client(api_key=settings.GEMINI_API_KEY)
                resp_gemini = client_gemini.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=messages[-1]["content"],
                    config=types.GenerateContentConfig(response_mime_type="application/json" if response_json else "text/plain")
                )
                if resp_gemini.text:
                    return resp_gemini.text
            except Exception as e:
                logger.warning(f"[IA] Gemini direto falhou: {e}")

        return None

    @classmethod
    async def process_citizen_chat(
        cls,
        conversation: List[ChatMessage],
        session_id: Optional[str] = None,
        registered_departments: Optional[List[Dict[str, str]]] = None,
        owner_id: Optional[int] = None
    ) -> ChatAgentResponse:
        """
        Orquestra a triagem do cidadão via arquitetura multiagente com memória persistente.
        Multiagentes:
        1. ConversationalAgent: Acolhimento e diálogo natural
        2. DepartmentRoutingAgent: Classificador contextual de intenção e destino
        3. DeterministicStateCollector: Coletor e extrator de slots
        4. ConfirmationAgent: Fechamento Human-in-the-Loop pré-geração de protocolo
        """
        from src.ai.agents.planner import Planner
        conv_list = [{"role": m.role, "content": m.content} for m in conversation]
        result = await Planner.process_turn(conv_list, session_id, registered_departments, owner_id=owner_id)
        
        st = result.get("service_type")
        if isinstance(st, str):
            st = ServiceType(st)

        raw_state = result.get("state", "COLLECTING")
        try:
            conv_state = ConversationState(raw_state)
        except Exception:
            conv_state = ConversationState.COLLECTING

        prop = result.get("proposal")
        prop_dto = None
        if prop and isinstance(prop, dict):
            try:
                prop_dto = ProposalDTO(**prop)
            except Exception:
                pass

        return ChatAgentResponse(
            reply=result["reply"],
            ready_to_register=result.get("ready_to_register", False),
            service_type=st,
            category=result.get("category"),
            department_name=result.get("department_name"),
            suggested_title=result.get("suggested_title"),
            suggested_description=result.get("suggested_description"),
            self_service_link=result.get("self_service_link"),
            self_service_instructions=result.get("self_service_instructions"),
            session_id=result.get("session_id"),
            missing_slots=result.get("missing_slots", []),
            state=conv_state,
            proposal=prop_dto,
            proposal_version=result.get("proposal_version")
        )

    @classmethod
    async def screen_demand(cls, title: str, description: str) -> AIScreeningResult:
        """Classifica reclamações apenas para órgãos cadastrados; não inventa destino."""
        combined_text = f"Título: {title}\nDescrição: {description}"
        from src.ai.agents.department_routing_agent import DepartmentRoutingAgent

        route = await DepartmentRoutingAgent.route(combined_text, intent_only=True)
        is_complaint = route.get("intent") == "PUBLIC_COMPLAINT"
        if is_complaint:
            route = await DepartmentRoutingAgent.route(combined_text, intent_only=False)
            is_complaint = route.get("intent") == "PUBLIC_COMPLAINT"
        department = route.get("department") if is_complaint else None
        category = route.get("category", "Aguardando triagem") if is_complaint else "Aguardando triagem"
        return AIScreeningResult(
            service_type=ServiceType.ATENDIMENTO_PUBLICO,
            category=category,
            department_name=department.get("name") if department else None,
            organized_summary=f"Fato relatado: {title}.\nDetalhamento: {description.strip()}.",
        )
