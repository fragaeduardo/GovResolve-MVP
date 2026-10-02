import json
import logging
import re
from typing import Optional
from src.config import settings
from src.api.schemas import AIScreeningResult
from src.db.schema import ServiceType
from src.ai.prompts.screening import SCREENING_SYSTEM_PROMPT

logger = logging.getLogger("govresolve.ai")


class AIScreeningService:
    @classmethod
    async def screen_demand(cls, title: str, description: str) -> AIScreeningResult:
        """
        Executa a triagem inteligente da demanda utilizando o modelo Gemini (RF006, RF007, RF008, RF009).
        Se a API Key não estiver disponível ou a chamada falhar, aciona o fallback heurístico determinístico (RNF004).
        """
        combined_text = f"Título: {title}\nDescrição: {description}"

        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "sua_chave_gemini_aqui":
            try:
                result = await cls._call_gemini_api(combined_text)
                if result:
                    return result
            except Exception as e:
                logger.error(f"[IA] Falha na chamada da API Gemini ({e}). Acionando fallback determinístico.")

        return cls._deterministic_fallback(title, description)

    @classmethod
    async def _call_gemini_api(cls, user_text: str) -> Optional[AIScreeningResult]:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=user_text,
                config=types.GenerateContentConfig(
                    system_instruction=SCREENING_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )

            if response.text:
                data = json.loads(response.text)
                return AIScreeningResult(
                    service_type=ServiceType(data.get("service_type", "ATENDIMENTO_PUBLICO")),
                    category=data.get("category", "Geral"),
                    department_name=data.get("department_name", "Secretaria de Obras e Infraestrutura"),
                    organized_summary=data.get("organized_summary", user_text[:300]),
                    self_service_link=data.get("self_service_link"),
                    self_service_instructions=data.get("self_service_instructions")
                )
        except Exception as e:
            logger.warning(f"[IA] Erro ao processar resposta do Gemini: {e}")
            return None

    @classmethod
    def _deterministic_fallback(cls, title: str, description: str) -> AIScreeningResult:
        """
        Classificador determinístico e resiliente para quando a LLM estiver inacessível.
        Garante fidelidade factual (RNF007) e disponibilidade contínua (RNF004).
        """
        text = f"{title} {description}".lower()

        # Palavras-chave indicativas de autoatendimento
        self_service_keywords = [
            "2 via", "segunda via", "iptu", "certidão", "certidao", "boleto",
            "agendamento", "consulta de debito", "nada consta", "holerite"
        ]

        is_self_service = any(kw in text for kw in self_service_keywords)

        if is_self_service:
            if "iptu" in text or "boleto" in text:
                category = "Tributos e Fazenda"
                dept = "Secretaria de Finanças e Fazenda"
                link = "https://cidadao.governo.br/servicos/iptu-2via"
                inst = "1. Acesse o portal do cidadão no link indicado.\n2. Informe o número de inscrição do imóvel.\n3. Selecione a parcela e emita a 2ª via do boleto."
            else:
                category = "Documentos e Certidões"
                dept = "Secretaria de Administração"
                link = "https://cidadao.governo.br/servicos/certidoes"
                inst = "1. Acesse o portal de serviços.\n2. Digite seu CPF e solicite a emissão da certidão gratuita."

            return AIScreeningResult(
                service_type=ServiceType.AUTOATENDIMENTO,
                category=category,
                department_name=dept,
                organized_summary=f"Solicitação de serviço autônomo identificado: {title}. O cidadão relata necessidade de emissão ou agendamento de procedimento realizável diretamente pela internet.",
                self_service_link=link,
                self_service_instructions=inst
            )

        # Regras para Atendimento Público
        if any(w in text for w in ["buraco", "asfalto", "cratera", "pavimentacao", "bueiro", "esgoto"]):
            category = "Infraestrutura Urbana"
            dept = "Secretaria de Obras e Infraestrutura"
        elif any(w in text for w in ["luz", "lampada", "iluminacao", "poste", "escuro"]):
            category = "Iluminação Pública"
            dept = "Secretaria de Obras e Infraestrutura"
        elif any(w in text for w in ["remedio", "medicamento", "posto", "ubs", "upa", "medico", "vacina"]):
            category = "Saúde Pública"
            dept = "Secretaria de Saúde"
        elif any(w in text for w in ["onibus", "ponto", "semáforo", "semaforo", "transito", "sinalizacao"]):
            category = "Trânsito e Transporte"
            dept = "Secretaria de Trânsito e Transporte"
        elif any(w in text for w in ["lixo", "entulho", "arvore", "poda", "praca", "limpeza"]):
            category = "Meio Ambiente e Limpeza"
            dept = "Secretaria de Meio Ambiente"
        elif any(w in text for w in ["escola", "creche", "merenda", "professor", "matricula"]):
            category = "Educação"
            dept = "Secretaria de Educação"
        else:
            category = "Serviços Gerais"
            dept = "Secretaria de Obras e Infraestrutura"

        # Organização fiel das informações (RNF007)
        organized_summary = (
            f"Fato relatado: {title}.\n"
            f"Detalhamento: {description.strip()}.\n"
            f"Encaminhamento sugerido: {dept}."
        )

        return AIScreeningResult(
            service_type=ServiceType.ATENDIMENTO_PUBLICO,
            category=category,
            department_name=dept,
            organized_summary=organized_summary,
            self_service_link=None,
            self_service_instructions=None
        )
