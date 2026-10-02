import re
from typing import Dict, Any, List
from src.ai.agents.session_store import AgentSession


class DeterministicStateCollector:
    """
    Agente Coletor Determinístico de Estado e Slots.
    Executado a cada resposta do cidadão:
    - Extrai informações factuais reais (logradouro, bairro, número, pontos de referência).
    - Não alucina nem presume dados ausentes.
    - Atualiza os slots coletados na sessão persistente.
    """

    LOGRADOURO_PATTERNS = [
        r"\b(?:rua|avenida|av\.?|alameda|travessa|rodovia|estrada|al\.)\s+([A-Za-z0-9À-ÖØ-öø-ÿ\-\s]+?)(?=[,\.;]|\b(?:no|nº|numero|número|setor|bairro|em frente|esquina|próximo|perto)\b|$)",
        r"\b(?:quadra|qd\.?)\s*([0-9A-Za-z]+)\s*(?:lote|lt\.?)\s*([0-9A-Za-z]+)\b"
    ]

    BAIRRO_PATTERNS = [
        r"\b(?:setor|bairro|jardim|jd\.?|vila|parque|pq\.?|residencial|distrito)\s+([A-Za-z0-9À-ÖØ-öø-ÿ\-\s]+?)(?=[,\.;]|\b(?:no|nº|numero|número|em frente|esquina|próximo|perto)\b|$)",
        r"\b(?:no|em|no bairro|no setor)\s+(centro|marista|bueno|sul|oeste|norte|campinas|pedro ludovico|central|vila nova|jardim américa|universitário)\b"
    ]

    REFERENCIA_PATTERNS = [
        r"\b(?:n[º°\.]?|número|numero|num\.?)\s*(\d+[A-Za-z]?)",
        r"\b(em frente\s+(?:ao?|à|do|da)?\s*[^,\.;]+)",
        r"\b(ao lado\s+(?:do|da|de)?\s*[^,\.;]+)",
        r"\b(próximo\s+(?:ao?|à|do|da)?\s*[^,\.;]+)",
        r"\b(perto\s+(?:do|da|de)?\s*[^,\.;]+)",
        r"\b(esquina\s+com\s+[^,\.;]+)",
        r"\b(cruzamento\s+com\s+[^,\.;]+)",
        r"\b(entre\s+[^,\.;]+)",
        r"\b(em frente\s+[^,\.;]+)"
    ]

    @classmethod
    def collect(cls, session: AgentSession) -> Dict[str, str]:
        # Unir todas as mensagens do cidadão para análise holística
        user_messages = [m["content"] for m in session.messages if m["role"] == "user"]
        full_text = " ".join(user_messages)

        collected = dict(session.collected_slots)

        # 1. Extração de Logradouro (avaliando da mensagem mais recente para a mais antiga)
        if "logradouro" not in collected:
            for msg in reversed(user_messages):
                match = re.search(r"\b(rua|avenida|av\.?|alameda|travessa|rodovia|estrada)\s+([A-Za-z0-9À-ÖØ-öø-ÿ\-]+(?:\s+[A-Za-z0-9À-ÖØ-öø-ÿ\-]+){0,3})\b", msg, re.IGNORECASE)
                if match:
                    prefix = match.group(1).title()
                    name = match.group(2).strip().rstrip(".,;")
                    clean_name = re.sub(r"^(?:é\s+na|e\s+na|no|na|da|do|de|em)\s+", "", name, flags=re.IGNORECASE).strip()
                    if clean_name.lower() not in ["onde", "aqui", "lá", "la", "que", "minha", "nossa", "daqui"]:
                        collected["logradouro"] = f"{prefix} {clean_name.title()}"
                        break

        # 2. Extração de Bairro / Setor (avaliando da mensagem mais recente para a mais antiga)
        if "bairro" not in collected:
            for msg in reversed(user_messages):
                for pattern in cls.BAIRRO_PATTERNS:
                    match = re.search(pattern, msg, re.IGNORECASE)
                    if match:
                        raw_val = match.group(0).strip().rstrip(".,;")
                        clean_val = re.sub(r"^(?:no|na|em|de|do|da)\s+", "", raw_val, flags=re.IGNORECASE).strip()
                        if not any(clean_val.lower().startswith(p) for p in ["rua", "avenida", "av"]):
                            collected["bairro"] = clean_val.title()
                            break
                if "bairro" in collected:
                    break

        # 3. Extração de Número ou Ponto de Referência
        if "referencia" not in collected:
            refs = []
            for pattern in cls.REFERENCIA_PATTERNS:
                matches = re.finditer(pattern, full_text, re.IGNORECASE)
                for m in matches:
                    val = m.group(0).strip().rstrip(".,;")
                    if val and val not in refs:
                        refs.append(val)
            if refs:
                collected["referencia"] = ", ".join(refs)

        # 4. Extração de Detalhes Adicionais
        if "detalhes" not in collected:
            details = []
            if re.search(r"\b(\d+\s+(?:dias|semanas|meses|mes))\b", full_text, re.IGNORECASE):
                m = re.search(r"\b(\d+\s+(?:dias|semanas|meses|mes))\b", full_text, re.IGNORECASE)
                details.append(f"Ocorrência há cerca de {m.group(1)}")
            if any(w in full_text.lower() for w in ["fundo", "profundo", "grande", "cratera", "acidente", "furou pneu", "risco"]):
                details.append("Risco à segurança / gravidade acentuada")
            if details:
                collected["detalhes"] = "; ".join(details)

        # Atualizar sessão
        session.collected_slots = collected
        return collected
