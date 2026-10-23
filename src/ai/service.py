import json
import logging
from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel
from src.config import settings
from src.api.schemas import AIScreeningResult
from src.db.schema import ServiceType
from src.ai.prompts.screening import SCREENING_SYSTEM_PROMPT

logger = logging.getLogger("govresolve.ai")


class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str


class ChatAgentResponse(BaseModel):
    reply: str
    ready_to_register: bool = False
    service_type: Optional[ServiceType] = None
    category: Optional[str] = None
    department_name: Optional[str] = None
    suggested_title: Optional[str] = None
    suggested_description: Optional[str] = None
    self_service_link: Optional[str] = None
    self_service_instructions: Optional[str] = None
    session_id: Optional[str] = None
    missing_slots: List[str] = []


class AIScreeningService:
    @classmethod
    async def call_llm_with_fallback(cls, messages: List[Dict[str, str]], response_json: bool = True) -> Optional[str]:
        """
        Executa a chamada ao OmniRoute com fallback em cascata entre no mínimo 5 modelos.
        Modelos testados: uq/turboderp/Qwen3.8-27B-exl3, google/gemini-2.5-flash,
        openai/gpt-4o-mini, anthropic/claude-3-5-sonnet, deepseek/deepseek-chat.
        """
        models_to_try = settings.omniroute_model_list
        headers = {
            "Authorization": f"Bearer {settings.OMNIROUTE_API_KEY}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=2.0) as client:
            for model_name in models_to_try:
                try:
                    payload = {
                        "model": model_name,
                        "messages": messages,
                        "temperature": 0.2
                    }
                    if response_json:
                        payload["response_format"] = {"type": "json_object"}

                    logger.info(f"[IA OmniRoute] Tentando modelo: {model_name}")
                    resp = await client.post(
                        f"{settings.OMNIROUTE_BASE_URL}/chat/completions",
                        headers=headers,
                        json=payload
                    )

                    if resp.status_code == 200:
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        logger.info(f"[IA OmniRoute] Sucesso com o modelo: {model_name}")
                        return content
                    else:
                        logger.warning(
                            f"[IA OmniRoute] Modelo {model_name} retornou status {resp.status_code}. Tentando próximo..."
                        )
                except Exception as e:
                    logger.warning(f"[IA OmniRoute] Erro no modelo {model_name} ({e}). Tentando próximo...")

        # Tentativa final com Gemini direto caso configurado
        if settings.GEMINI_API_KEY:
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
        owner_id: Optional[int] = None
    ) -> ChatAgentResponse:
        """
        Orquestra a triagem do cidadão via arquitetura multiagente com memória persistente.
        Multiagentes:
        1. ConversationalAgent: Acolhimento e diálogo natural
        2. SlotMappingAgent: Mapeador de requisitos (acionado 1x por demanda)
        3. DeterministicStateCollector: Coletor e extrator de slots
        4. ConfirmationAgent: Fechamento Human-in-the-Loop pré-geração de protocolo
        """
        from src.ai.agents.planner import Planner
        conv_list = [{"role": m.role, "content": m.content} for m in conversation]
        result = await Planner.process_turn(conv_list, session_id, owner_id=owner_id)
        
        st = result.get("service_type")
        if isinstance(st, str):
            st = ServiceType(st)

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
            missing_slots=result.get("missing_slots", [])
        )

    @classmethod
    def _deterministic_chat_agent(cls, conversation: List[ChatMessage], full_text: str) -> ChatAgentResponse:
        """Fallback determinístico de alta inteligência para o Chatbot de Triagem."""
        text_lower = full_text.lower()

        # Checagem de Autoatendimento
        if any(w in text_lower for w in ["iptu", "certidao", "certidão", "2 via", "segunda via", "boleto", "debito"]):
            if "iptu" in text_lower:
                return ChatAgentResponse(
                    reply="Identifiquei que sua solicitação refere-se à emissão de 2ª via ou consulta de IPTU. Esse serviço pode ser realizado de forma autônoma e imediata diretamente pelo portal de finanças da prefeitura, sem necessidade de abertura de processo presencial.",
                    ready_to_register=False,
                    service_type=ServiceType.AUTOATENDIMENTO,
                    category="Tributos Municipais",
                    department_name="SEFIN — Secretaria Municipal de Finanças",
                    suggested_title="Emissão de 2ª Via de IPTU",
                    suggested_description="Solicitação autônoma de guia de IPTU via portal do cidadão.",
                    self_service_link=None,
                    self_service_instructions="1. Consulte o portal oficial da prefeitura por endereco verificado.\n2. Digite a inscrição imobiliária ou CPF do proprietário.\n3. Selecione o exercício e faça o download do DAM com código de barras ou Pix."
                )
            else:
                return ChatAgentResponse(
                    reply="Para emissão de certidões negativas ou certidões de regularidade fiscal, você não precisa aguardar análise de um servidor. O documento é gerado gratuitamente e com validação eletrônica pelo portal.",
                    ready_to_register=False,
                    service_type=ServiceType.AUTOATENDIMENTO,
                    category="Certidões e Regularidade",
                    department_name="SEFIN — Secretaria Municipal de Finanças",
                    suggested_title="Emissão de Certidão Negativa Municipal",
                    suggested_description="Emissão automatizada de CND pelo portal de serviços.",
                    self_service_link=None,
                    self_service_instructions="1. Consulte o serviço de certidões no portal oficial da prefeitura.\n2. Informe seu CPF/CNPJ.\n3. Faça o download imediato da certidão com código de autenticidade."
                )

        # Checagem de falta de localização para demandas operacionais de campo
        has_location = any(w in text_lower for w in ["rua", "avenida", "av", "setor", "bairro", "esquina", "alameda", "número", "numero", "próximo", "perto"])
        
        # Mapeamento do órgão competente
        dept_name = "SEINFRA — Secretaria Municipal de Infraestrutura Urbana"
        category = "Infraestrutura Urbana"

        if any(w in text_lower for w in ["buraco", "asfalto", "cratera", "pavimentacao", "bueiro", "galeria"]):
            dept_name = "SEINFRA — Secretaria Municipal de Infraestrutura Urbana"
            category = "Obras e Pavimentação"
        elif any(w in text_lower for w in ["lixo", "entulho", "arvore", "árvore", "poda", "praca", "praça", "limpeza", "varricao"]):
            dept_name = "COMURG — Companhia de Urbanização"
            category = "Limpeza Urbana e Urbanização"
        elif any(w in text_lower for w in ["posto", "ubs", "upa", "medico", "médico", "remedio", "medicamento", "saude", "saúde", "dengue"]):
            dept_name = "SMS — Secretaria Municipal de Saúde"
            category = "Saúde Pública"
        elif any(w in text_lower for w in ["semaforo", "semáforo", "sinal", "transito", "trânsito", "onibus", "ônibus", "faixa"]):
            dept_name = "SMM — Secretaria Municipal de Mobilidade e Trânsito"
            category = "Mobilidade e Trânsito"
        elif any(w in text_lower for w in ["som", "barulho", "poluicao", "poluição", "desmatamento", "ambiental"]):
            dept_name = "AMMA — Agência Municipal do Meio Ambiente"
            category = "Meio Ambiente"
        elif any(w in text_lower for w in ["escola", "creche", "cmei", "merenda", "professor"]):
            dept_name = "SME — Secretaria Municipal de Educação"
            category = "Educação Básica"
        elif any(w in text_lower for w in ["vazamento", "agua", "água", "esgoto", "cano"]):
            dept_name = "SANEAGO — Companhia de Saneamento"
            category = "Saneamento Básico"
        elif any(w in text_lower for w in ["poste", "luz", "iluminacao", "iluminação", "lampada", "lâmpada"]):
            dept_name = "Concessionária de Iluminação Pública"
            category = "Iluminação Pública"

        last_user_msg = conversation[-1].content if conversation else full_text

        if not has_location:
            return ChatAgentResponse(
                reply=f"Compreendi a situação relatada. Essa demanda é de competência da {dept_name}. "
                      f"Para que a equipe operacional possa ser despachada e atender à solicitação, por favor, me informe o endereço (nome da rua, número aproximado, bairro ou ponto de referência).",
                ready_to_register=False,
                service_type=ServiceType.ATENDIMENTO_PUBLICO,
                category=category,
                department_name=dept_name
            )

        # Já possui detalhes suficientes para registro formal
        title = last_user_msg[:60] if len(last_user_msg) <= 60 else f"{category}: {last_user_msg[:50]}..."
        return ChatAgentResponse(
            reply=f"Excelente, reuni todas as informações necessárias. Estruturei sua solicitação para encaminhamento formal à {dept_name}. "
                  f"Por favor, confira os dados do cartão abaixo e clique em 'Confirmar e Gerar Protocolo' para submeter a demanda.",
            ready_to_register=True,
            service_type=ServiceType.ATENDIMENTO_PUBLICO,
            category=category,
            department_name=dept_name,
            suggested_title=f"Solicitação de {category}",
            suggested_description=f"Relato do cidadão: {full_text.strip()}"
        )

    @classmethod
    async def screen_demand(cls, title: str, description: str) -> AIScreeningResult:
        """Método de triagem direta para o endpoint tradicional e testes."""
        combined_text = f"Título: {title}\nDescrição: {description}"
        messages = [
            {"role": "system", "content": SCREENING_SYSTEM_PROMPT},
            {"role": "user", "content": combined_text}
        ]

        output = await cls.call_llm_with_fallback(messages, response_json=True)
        if output:
            try:
                data = json.loads(output)
                return AIScreeningResult(
                    service_type=ServiceType(data.get("service_type", "ATENDIMENTO_PUBLICO")),
                    category=data.get("category", "Geral"),
                    department_name=data.get("department_name", "SEINFRA — Secretaria Municipal de Infraestrutura Urbana"),
                    organized_summary=data.get("organized_summary", combined_text[:300]),
                    self_service_link=data.get("self_service_link"),
                    self_service_instructions=data.get("self_service_instructions")
                )
            except Exception as e:
                logger.warning(f"[IA] Erro de parsing JSON: {e}")

        # Fallback determinístico
        chat_resp = cls._deterministic_chat_agent([ChatMessage(role="user", content=combined_text)], combined_text)
        return AIScreeningResult(
            service_type=chat_resp.service_type or ServiceType.ATENDIMENTO_PUBLICO,
            category=chat_resp.category or "Geral",
            department_name=chat_resp.department_name or "SEINFRA — Secretaria Municipal de Infraestrutura Urbana",
            organized_summary=f"Fato relatado: {title}.\nDetalhamento: {description.strip()}.",
            self_service_link=chat_resp.self_service_link,
            self_service_instructions=chat_resp.self_service_instructions
        )
