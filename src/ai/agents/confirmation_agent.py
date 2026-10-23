from typing import Dict, Any, Optional
from pydantic import BaseModel
from src.ai.agents.session_store import AgentSession

class ConfirmationCard(BaseModel):
    reply: str
    ready_to_register: bool = True
    department_name: str
    category: str
    suggested_title: str
    suggested_description: str


class ConfirmationAgent:
    """
    Agente de Fechamento & Human-in-the-Loop.
    Quando todos os requisitos mandatórios foram coletados:
    1. Consolida a solicitação com total fidelidade factual (RNF007);
    2. Atribui formalmente o órgão municipal competente;
    3. Monta o cartão estruturado para revisão e confirmação humana pelo cidadão.
    """

    @classmethod
    def generate_confirmation(cls, session: AgentSession) -> ConfirmationCard:
        dept = session.department_name or "Ouvidoria — fila de revisão humana"
        cat = session.category or "Zeladoria Urbana"
        slots = session.collected_slots

        user_msgs = [m["content"] for m in session.messages if m["role"] == "user"]
        # Apenas fatos efetivamente enviados pelo cidadao e slots extraidos.
        location = ", ".join(
            slots[key] for key in ("logradouro", "bairro") if slots.get(key)
        )
        suggested_title = f"{cat}: {location}" if location else cat
        suggested_title = suggested_title[:200]

        desc_parts = []
        if location:
            desc_parts.append(f"Local informado: {location}.")
        if slots.get("referencia"):
            desc_parts.append(f"Referencia informada: {slots['referencia']}.")
        if slots.get("detalhes"):
            desc_parts.append(f"Observacoes coletadas: {slots['detalhes']}.")
        desc_parts.append(f"Relato original do cidadao: {' | '.join(user_msgs)}.")
        suggested_description = " ".join(desc_parts)
        reply = (
            f"Organizei sua solicitacao para {dept}. Confira os dados exibidos "
            "e clique em 'Confirmar e Gerar Protocolo' se concordar com o registro."
        )
        session.is_ready_to_register = True
        session.approved_title = suggested_title
        session.approved_description = suggested_description

        return ConfirmationCard(
            reply=reply,
            ready_to_register=True,
            department_name=dept,
            category=cat,
            suggested_title=suggested_title,
            suggested_description=suggested_description
        )
