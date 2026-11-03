import json
import logging
import re
import unicodedata
from typing import List, Dict, Optional
from src.ai.service import AIScreeningService
from src.ai.agents.session_store import AgentSession

logger = logging.getLogger("govresolve.ai.conversational")


class ConversationalAgent:
    """
    Agente Conversacional Empático e Inteligente do GovResolve.
    Conduz o diálogo com o cidadão de forma humanizada, institucional e sóbria:
    - Responde cordialmente a saudações sem antecipar protocolos;
    - Utiliza LLM (OmniRoute com fallback de múltiplos modelos) para formular respostas contextuais e naturais;
    - Possui gerador semântico de contingência altamente contextualizado por órgão e tipo de problema;
    - NUNCA utiliza templates genéricos repetitivos e NUNCA utiliza emojis;
    - Integra a menção ao órgão competente de forma fluida no texto, sem cabeçalhos soltos.
    """

    @classmethod
    def generate_greeting_reply(cls) -> str:
        return (
            "Olá! Sou o assistente virtual de triagem do GovResolve. Como posso ajudar você hoje? "
            "Você pode relatar um problema em sua rua (como buraco, iluminação pública, lixo ou semáforo) "
            "ou solicitar informações sobre serviços municipais."
        )

    @classmethod
    async def generate_clarification(
        cls,
        session: AgentSession,
        last_user_input: str,
        suggested_question: str,
    ) -> str:
        """Apresenta a pergunta do classificador e retorna ao mesmo estágio de triagem."""
        text = await AIScreeningService.call_llm_with_fallback([
            {"role": "system", "content": (
                "Formule uma pergunta curta e cordial ao cidadão usando somente o esclarecimento fornecido. "
                "Considere o assunto ativo, os campos já preenchidos e os campos pendentes. Nunca peça de novo um campo preenchido. "
                "Não responda por ele nem acrescente suposições. Retorne apenas a pergunta."
            )},
            {"role": "user", "content": json.dumps({
                "assunto_em_andamento": session.topic_summary or session.category,
                "ultima_mensagem": last_user_input,
                "campos_ja_coletados": session.collected_slots,
                "campos_pendentes": session.get_missing_mandatory_slots(),
                "esclarecimento_necessario": suggested_question,
            }, ensure_ascii=False)},
        ], response_json=False)
        missing_slots = session.get_missing_mandatory_slots()
        if text and text.strip() and not cls._asks_for_collected_slot(
            text.strip(), session, missing_slots, last_user_input
        ):
            return text.strip()
        if session.topic_identified and missing_slots and cls._asks_for_collected_slot(
            suggested_question, session, missing_slots, last_user_input
        ):
            return cls._generate_expert_reply(session, missing_slots)
        return suggested_question

    @classmethod
    def _generate_expert_reply(
        cls,
        session: AgentSession,
        missing_slots: List[str]
    ) -> str:
        """Perguntas curtas para pedir somente o dado que falta."""
        missing = set(missing_slots)
        if missing == {"referencia"}:
            if "logradouro" in session.collected_slots:
                return "Qual é o número ou um ponto de referência desse endereço?"
            return "Qual é o número ou um ponto de referência?"

        if "logradouro" in missing:
            subject = {
                "transito_sinalizacao": "o semáforo",
                "buraco_asfalto": "o buraco",
                "limpeza_entulho_poda": "o lixo, entulho ou árvore",
                "saude_atendimento": "o posto ou unidade de saúde",
            }.get(session.problem_type, "o problema")
            requested = ["a rua ou um lugar conhecido"]
            if "bairro" in missing:
                requested.append("o bairro")
            if "referencia" in missing:
                requested.append("um número ou ponto de referência")
            if len(requested) == 1:
                fields = requested[0]
            else:
                fields = ", ".join(requested[:-1]) + " e " + requested[-1]
            return f"Onde fica {subject}? Diga {fields}."

        if missing == {"bairro"}:
            return "Em qual bairro fica esse endereço?"
        if missing == {"bairro", "referencia"}:
            return "Qual é o bairro e o número ou ponto de referência desse endereço?"

        return "Pode acrescentar um detalhe que ainda não aparece na ficha?"

    @staticmethod
    def _asks_for_collected_slot(
        text: str,
        session: AgentSession,
        missing_slots: List[str],
        last_user_input: str = "",
    ) -> bool:
        """Reject questions that recap the report or ask for a field already in the session."""
        normalized = unicodedata.normalize("NFKD", text.casefold())
        normalized = "".join(char for char in normalized if not unicodedata.combining(char))
        normalized = re.sub(r"\s+", " ", normalized).strip()
        if re.match(r"^(?:entendi|compreendi|obrigado|obrigada)\b", normalized):
            return True
        if len(last_user_input.strip()) >= 20:
            normalized_input = unicodedata.normalize("NFKD", last_user_input.casefold())
            normalized_input = "".join(char for char in normalized_input if not unicodedata.combining(char))
            normalized_input = re.sub(r"\s+", " ", normalized_input).strip().rstrip(".!?")
            if normalized_input and normalized_input in normalized:
                return True
        asks_something = "?" in text or re.search(
            r"\b(?:qual|quais|onde|em que|me diga|informe|poderia|pode dizer|diga)\b",
            normalized,
        )
        if not asks_something:
            return True

        field_terms = {
            "logradouro": r"\b(?:rua|avenida|av\.?|localizacao|local|onde)\b|\b(?:qual|informe|diga|me diga|pode informar|poderia informar|pode dizer|pode falar)\b.{0,24}\bendereco\b",
            "bairro": r"\b(?:bairro|setor|regiao)\b",
            "referencia": r"\b(?:referencia|ponto|numero|cruzamento|esquina)\b",
        }
        if session.topic_identified and missing_slots:
            missing_terms = [field_terms[slot] for slot in missing_slots if slot in field_terms]
            if missing_terms and not any(re.search(pattern, normalized) for pattern in missing_terms):
                return True
        for slot, pattern in field_terms.items():
            if slot in session.collected_slots and slot not in missing_slots:
                if re.search(pattern, normalized):
                    return True
        return False

    @classmethod
    async def generate_next_question(
        cls,
        session: AgentSession,
        last_user_input: str,
        missing_slots: List[str]
    ) -> str:
        """
        Gera a próxima fala do assistente.
        Tenta formular via provedor de IA configurado para garantir naturalidade,
        com fallback imediato no motor semântico especializado.
        """
        dept = session.department_name or "órgão municipal competente"
        collected = session.collected_slots

        prompt = (
            f"Instrução do Sistema: Você é o assistente virtual de triagem do GovResolve, sistema oficial de atendimento da Prefeitura. "
            f"Seu objetivo é conduzir um diálogo cordial, empático, claro e estritamente profissional.\n"
            f"REGRAS MANDATÓRIAS:\n"
            f"1. NUNCA USE EMOJIS.\n"
            f"2. NUNCA comece a resposta com o nome isolado do órgão nem cabeçalhos como 'SET — Secretaria...' no início da frase.\n"
            f"3. Vá direto ao ponto. Não repita o relato, não comece com 'Entendi' ou 'Compreendi' e não agradeça antes de perguntar.\n"
            f"4. Peça apenas os dados que faltam, em linguagem comum. Para localização, diga 'endereço' e, se útil, dê exemplos como rua/avenida, número, bairro ou ponto de referência; não use 'logradouro'.\n"
            f"5. Aproveite o que a pessoa já informou e faça no máximo uma pergunta simples, sem repetir os dados coletados.\n"
            f"6. Escreva APENAS a mensagem direta para o cidadão em no máximo 2 frases curtas e objetivas.\n\n"
            f"Contexto do atendimento:\n"
            f"- Órgão Responsável: {dept}\n"
            f"- Categoria: {session.category or 'Zeladoria'}\n"
            f"- Assunto relatado: {session.topic_summary or 'não identificado'}\n"
            f"- Dados já informados pelo cidadão: {json.dumps(collected, ensure_ascii=False)}\n"
            f"- Informações ainda necessárias: {', '.join(missing_slots)}\n"
            f"- Última mensagem do cidadão: \"{last_user_input}\""
        )

        fallback = cls._generate_expert_reply(session, missing_slots)
        text = await AIScreeningService.call_llm_with_fallback(
            [{"role": "user", "content": prompt}], response_json=False
        )
        if text and text.strip() and not cls._asks_for_collected_slot(
            text.strip(), session, missing_slots, last_user_input
        ):
            return text.strip()

        # A saída do modelo é descartada quando repete um campo já coletado.
        return fallback
