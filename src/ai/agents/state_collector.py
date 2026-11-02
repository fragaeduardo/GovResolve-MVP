import re
from typing import Dict, Any, List
from src.ai.agents.session_store import AgentSession


class DeterministicStateCollector:
    """
    Agente Coletor Determinístico de Estado e Slots.
    Executado a cada resposta do cidadão:
    - Extrai informações factuais reais (logradouro, bairro, número, pontos de referência e cruzamentos).
    - Não alucina nem presume dados ausentes.
    - Atualiza os slots coletados na sessão persistente.
    """

    LOGRADOURO_PATTERNS = [
        r"\b(?:rua|avenida|av\.?|alameda|travessa|rodovia|estrada|al\.)\s+([A-Za-z0-9À-ÖØ-öø-ÿ\-\s]+?)(?=[,\.;]|\b(?:no|nº|numero|número|setor|bairro|em frente|esquina|próximo|perto|cruzamento)\b|$)",
        r"\b(?:quadra|qd\.?)\s*([0-9A-Za-z]+)\s*(?:lote|lt\.?)\s*([0-9A-Za-z]+)\b"
    ]

    BAIRRO_PATTERNS = [
        r"\b(?:setor|bairro|jardim|jd\.?|vila|parque|pq\.?|residencial|distrito)\s+([A-Za-z0-9À-ÖØ-öø-ÿ\-\s]+?)(?=[,\.;]|\b(?:no|nº|numero|número|em frente|esquina|próximo|perto|cruzamento)\b|$)"
    ]

    NAMED_PLACE_PATTERN = (
        r"\b(praça|praca|parque|bosque|terminal|escola|hospital|posto\s+de\s+saúde|"
        r"unidade\s+de\s+saúde)\s+(.+?)"
        r"(?=\s*(?:[,;.]|$)|\s+\b(?:no|na|em|perto|próximo|proximo|em\s+frente|"
        r"esquina|cruzamento|bairro|setor)\b)"
    )

    REFERENCIA_PATTERNS = [
        r"\b(?:n[º°\.]?|número|numero|num\.?)\s*(\d+[A-Za-z]?)",
        r"\b(em frente\s+(?:ao?|à|do|da)?\s*[^,\.;]+)",
        r"\b(ao lado\s+(?:do|da|de)?\s*[^,\.;]+)",
        r"\b(próximo\s+(?:ao?|à|do|da)?\s*[^,\.;]+)",
        r"\b(perto\s+(?:do|da|de)?\s*[^,\.;]+)",
        r"\b(esquina\s+(?:com|da|de|entre)?\s*[^,\.;]+)",
        r"\b(cruzamento\s+(?:com|da|de|entre)?\s*[^,\.;]+)",
        r"\b(entre\s+[^,\.;]+)"
    ]

    @classmethod
    def collect(cls, session: AgentSession, allow_overwrite: bool = False) -> Dict[str, str]:
        user_messages = [m["content"] for m in session.messages if m["role"] == "user"]
        last_user_msg = user_messages[-1] if user_messages else ""

        collected = dict(session.collected_slots)
        is_revising = allow_overwrite or (session.state == "REVISING")
        changed_fields: List[str] = []

        if re.match(r"^(?:rua|avenida|av\.?|alameda|travessa|rodovia|estrada)\s+e\s+os\s+carros\b", collected.get("logradouro", ""), re.IGNORECASE):
            collected.pop("logradouro")
            changed_fields.append("logradouro")

        # 1. Extração de Logradouro
        new_logradouro = None
        # Se for revisão, prioriza extrair da última mensagem
        messages_to_check = [last_user_msg] if last_user_msg else []
        for msg in messages_to_check:
            match = re.search(
                r"\b(rua|avenida|av\.?|alameda|travessa|rodovia|estrada)\s+(.+?)(?=[,\.;]|\b(?:com|no|na|n[º°]|numero|número|setor|bairro|em frente|esquina|próximo|perto|cruzamento)\b|$)",
                msg,
                re.IGNORECASE
            )
            if not match:
                informal_match = re.search(r"\b(?:na|no|pela)\s+([A-Za-zÀ-ÖØ-öø-ÿ]+-?\d+[A-Za-z0-9-]*)\b", msg, re.IGNORECASE)
                if informal_match:
                    new_logradouro = informal_match.group(1).upper()
                else:
                    place_match = re.search(cls.NAMED_PLACE_PATTERN, msg, re.IGNORECASE)
                    if place_match:
                        label = " ".join(place_match.group(1).split()).title()
                        name = place_match.group(2).strip().rstrip(".,; ")
                        if name and name.casefold() not in {
                            "perto", "próximo", "proximo", "em frente", "esquina", "cruzamento"
                        }:
                            name = name[0].upper() + name[1:]
                            new_logradouro = f"{label} {name}"
            if match:
                prefix = match.group(1).title()
                name = match.group(2).strip().rstrip(".,;")
                clean_name = re.sub(r"^(?:é\s+na|e\s+na|no|na|da|do|de|em)\s+", "", name, flags=re.IGNORECASE).strip()
                if (
                    clean_name.lower() not in ["onde", "aqui", "lá", "la", "que", "minha", "nossa", "daqui"]
                    and not clean_name.lower().startswith(("e ", "com ", "tem ", "está ", "estao ", "fica "))
                ):
                    # Preserve the citizen's spelling; title() mangles names and turns
                    # sentence fragments such as "e os carros estão" into fake streets.
                    clean_name = clean_name[0].upper() + clean_name[1:] if clean_name else clean_name
                    new_logradouro = f"{prefix} {clean_name}"
        if new_logradouro and collected.get("logradouro", "").casefold() != new_logradouro.casefold():
            # The latest explicit address also repairs bad values saved by older sessions.
            collected["logradouro"] = new_logradouro
            changed_fields.append("logradouro")
        # 2. Extração de Bairro / Setor
        new_bairro = None
        bairro_candidates = []
        for msg in messages_to_check:
            for pattern in cls.BAIRRO_PATTERNS:
                for match in re.finditer(pattern, msg, re.IGNORECASE):
                    raw_val = match.group(0).strip().rstrip(".,;")
                    clean_val = re.sub(r"^(?:no|na|em|de|do|da)\s+", "", raw_val, flags=re.IGNORECASE).strip()
                    if not any(clean_val.lower().startswith(p) for p in ["rua", "avenida", "av"]):
                        prefix = clean_val.split(maxsplit=1)[0].casefold().rstrip(".")
                        if (
                            prefix in {"parque", "pq"}
                            and new_logradouro
                            and clean_val.casefold() == new_logradouro.casefold()
                        ):
                            continue
                        priority = 0 if prefix in {"parque", "pq"} else 1
                        bairro_candidates.append((priority, clean_val))

            if bairro_candidates:
                # Explicit Setor/Bairro wins over a named park mentioned in the same answer.
                new_bairro = max(bairro_candidates, key=lambda candidate: candidate[0])[1]
                break

        if new_bairro:
            if collected.get("bairro", "").casefold() != new_bairro.casefold():
                collected["bairro"] = new_bairro
                changed_fields.append("bairro")

        # 3. Extração de Número, Ponto de Referência ou Cruzamento
        refs = []
        source_for_refs = last_user_msg
        for pattern in cls.REFERENCIA_PATTERNS:
            matches = re.finditer(pattern, source_for_refs, re.IGNORECASE)
            for m in matches:
                val = m.group(0).strip().rstrip(".,;")
                if not val:
                    continue
                normalized_val = val.casefold()
                if any(normalized_val in existing.casefold() for existing in refs):
                    continue
                refs = [existing for existing in refs if existing.casefold() not in normalized_val]
                refs.append(val)
        if refs:
            ref_str = ", ".join(refs)
            if "referencia" not in collected:
                collected["referencia"] = ref_str
                changed_fields.append("referencia")
            elif is_revising and collected["referencia"] != ref_str:
                collected["referencia"] = ref_str
                changed_fields.append("referencia")

        # Cruzamentos já identificam o endereço e a referência em uma única resposta.
        crossing = re.search(r"(?:cruzamento|esquina)\s+(?:da|do|de|com)?\s*(.+?)\s+no\s+(?:bairro|setor|centro)\b", last_user_msg, re.IGNORECASE)
        if crossing:
            address = crossing.group(1).strip().rstrip(".,;")
            if "logradouro" not in collected:
                collected["logradouro"] = address
                changed_fields.append("logradouro")
            if "referencia" not in collected:
                collected["referencia"] = f"Cruzamento: {address}"
                changed_fields.append("referencia")

        # Atualizar sessão
        session.collected_slots = collected
        session.last_changed_fields = changed_fields
        return collected
