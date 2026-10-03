import json
import logging
import re
from typing import List, Dict, Optional
import httpx

from src.config import settings
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
    def _generate_expert_reply(
        cls,
        session: AgentSession,
        last_user_input: str,
        missing_slots: List[str]
    ) -> str:
        """Gerador semântico contextualizado por órgão e tipo de demanda (Fallback de Alta Fidelidade)."""
        dept = session.department_name or "órgão municipal competente"
        prob_type = session.problem_type or ""
        collected = session.collected_slots

        # Se já coletamos rua e bairro, pedir ponto de referência / cruzamento
        if "referencia" in missing_slots and "logradouro" not in missing_slots and "bairro" not in missing_slots:
            logradouro = collected.get("logradouro", "o logradouro informado")
            bairro = collected.get("bairro", "o bairro informado")
            if prob_type == "transito_sinalizacao":
                return (
                    f"Perfeito, registrei o endereço na {logradouro}, no bairro {bairro}. "
                    f"Para que a equipe de semáforos da {dept} chegue com precisão, "
                    f"você saberia informar com qual rua ou avenida é o cruzamento ou um ponto de referência próximo?"
                )
            return (
                f"Excelente! Registrei a localização na {logradouro}, no bairro {bairro}. "
                f"Para auxiliar a equipe técnica da {dept} a encontrar o ponto exato com facilidade, "
                f"você saberia informar um número predial aproximado ou um ponto de referência próximo "
                f"(como uma esquina, comércio, escola ou praça)?"
            )

        # Se já coletamos logradouro, mas falta bairro
        if "bairro" in missing_slots and "logradouro" not in missing_slots:
            logradouro = collected.get("logradouro", "o logradouro informado")
            return (
                f"Perfeito, anotei o endereço na {logradouro}. Em qual bairro ou setor da cidade fica localizado esse ponto?"
            )

        # Se falta o endereço inicial, formular com acolhimento fluido e contextualizado
        if prob_type == "transito_sinalizacao":
            return (
                f"Compreendi a ocorrência referente a semáforo apagado ou sinalização de trânsito. "
                f"Essa demanda é atendida pela {dept}. Para que a equipe de manutenção possa agir no local, "
                f"por gentileza informe o cruzamento ou rua onde o semáforo está apagado e o bairro."
            )
        elif prob_type == "limpeza_entulho_poda":
            return (
                f"Compreendi a solicitação referente a lixo acumulado ou poda de árvores. Esse serviço é executado pela {dept}. "
                f"Para que a equipe de coleta e poda possa se deslocar até o local, por favor, me informe o nome da rua ou avenida e o bairro onde o serviço deve ser realizado."
            )
        elif prob_type == "saude_atendimento":
            return (
                f"Entendi sua solicitação sobre atendimento médico ou fornecimento de medicamentos, área sob responsabilidade da {dept}. "
                f"Para formalizarmos o pedido e notificarmos a coordenação da unidade, qual é o nome do posto de saúde (UBS/UPA) ou o endereço e bairro onde o fato ocorreu?"
            )
        elif prob_type == "buraco_asfalto":
            return (
                f"Compreendi o problema de buraco ou asfalto danificado na via. A {dept} é responsável pelas obras de pavimentação e tapa-buracos. "
                f"Por favor, me informe em qual rua ou avenida e em qual bairro o dano no asfalto está localizado."
            )
        elif prob_type == "iluminacao_publica":
            return (
                f"Entendi a necessidade de reparo na iluminação pública. O conserto de lâmpadas apagadas é realizado pela {dept}. "
                f"Para agendarmos a manutenção, em qual rua ou avenida e bairro o poste apagado se encontra?"
            )
        elif prob_type == "saneamento_agua_esgoto":
            return (
                f"Registrei o relato de vazamento de água tratada ou esgoto na via, serviço gerenciado pela {dept}. "
                f"Para enviarmos com rapidez a equipe de manutenção de rede, qual é o endereço (rua e bairro) do vazamento?"
            )
        elif prob_type == "meio_ambiente_fiscalizacao":
            return (
                f"Compreendi a denúncia ou solicitação ambiental, sob competência da {dept}. "
                f"Para o deslocamento da equipe de fiscalização, informe o endereço completo e o bairro da ocorrência."
            )
        elif prob_type == "educacao_escolar":
            return (
                f"Entendi a demanda referente à educação municipal, atendida pela {dept}. "
                f"Qual é o nome da escola ou creche (CMEI) e em qual bairro ela está localizada?"
            )

        return (
            f"Compreendi sua solicitação. O atendimento será direcionado à {dept}. "
            f"Para prosseguirmos com a abertura do chamado técnico, por favor, informe o nome da rua ou avenida e o bairro onde o serviço é necessário."
        )

    @classmethod
    async def generate_next_question(
        cls,
        session: AgentSession,
        last_user_input: str,
        missing_slots: List[str]
    ) -> str:
        """
        Gera a próxima fala do assistente.
        Tenta formular via LLM do OmniRoute para garantir naturalidade,
        com fallback imediato no motor semântico especializado.
        """
        dept = session.department_name or "órgão municipal competente"
        collected = session.collected_slots

        prompt = (
            f"Instrução do Sistema: Você é o assistente virtual de triagem do GovResolve, sistema oficial de atendimento da Prefeitura. "
            f"Seu objetivo é conduzir um diálogo cordial, empático, claro e estritamente profissional.\n"
            f"REGRAS MANDATÓRIAS:\n"
            f"1. NUNCA USE EMOJIS.\n"
            f"2. NUNCA comece a resposta com o nome isolado do órgão nem cabeçalhos como 'SMM — Secretaria...' no início da frase.\n"
            f"3. Inicie acolhendo a demanda de forma natural e integrada (ex: 'Compreendi a ocorrência referente ao semáforo. Essa demanda é atendida pela {dept}...').\n"
            f"4. Peça de forma natural e educada as informações faltantes: {', '.join(missing_slots)} (ex: cruzamento/rua e bairro).\n"
            f"5. Escreva APENAS a mensagem direta para o cidadão em no máximo 2 ou 3 frases curtas e objetivas.\n\n"
            f"Contexto do atendimento:\n"
            f"- Órgão Responsável: {dept}\n"
            f"- Categoria: {session.category or 'Zeladoria'}\n"
            f"- Dados já informados pelo cidadão: {json.dumps(collected, ensure_ascii=False)}\n"
            f"- Informações ainda necessárias: {', '.join(missing_slots)}\n"
            f"- Última mensagem do cidadão: \"{last_user_input}\""
        )

        models = settings.omniroute_model_list
        headers = {
            "Authorization": f"Bearer {settings.OMNIROUTE_API_KEY}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=1.8) as client:
            for model_name in models:
                try:
                    payload = {
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3
                    }
                    resp = await client.post(
                        f"{settings.OMNIROUTE_BASE_URL}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["choices"][0]["message"]["content"].strip()
                        if "---" in text:
                            text = text.split("---")[-1].strip()
                        # Limpeza de preâmbulos robóticos
                        lines = [
                            l for l in text.split("\n")
                            if not l.strip().lower().startswith(("entendido", "vou conduzir", "aqui está", "com base", "resposta:"))
                        ]
                        cleaned_text = "\n".join(lines).strip()
                        # Se o texto começar com o nome do órgão isolado antes de um ponto ou quebra, ajustar
                        if cleaned_text.startswith(dept) and len(cleaned_text) > len(dept) + 2:
                            remainder = cleaned_text[len(dept):].lstrip(" .:-")
                            cleaned_text = f"Entendi sua solicitação referente ao atendimento da {dept}. {remainder}"

                        if cleaned_text and len(cleaned_text) > 15:
                            return cleaned_text
                except Exception as e:
                    logger.debug(f"[ConversationalAgent] Modelo {model_name} indisponível: {e}")
                    continue

        # Fallback semântico garantido e altamente contextualizado
        return cls._generate_expert_reply(session, last_user_input, missing_slots)
