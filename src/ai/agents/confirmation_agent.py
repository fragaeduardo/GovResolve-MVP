import uuid
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from src.ai.agents.session_store import AgentSession

class ConfirmationCard(BaseModel):
    reply: str
    ready_to_register: bool = True
    department_name: str
    category: str
    suggested_title: str
    suggested_description: str
    proposal: Optional[Dict[str, Any]] = None
    proposal_version: int = 1
    state: str = "AWAITING_CONFIRMATION"


class ConfirmationAgent:
    """
    Agente de Fechamento & Human-in-the-Loop.
    Quando todos os requisitos mandatórios foram coletados:
    1. Consolida a solicitação com total fidelidade factual (RNF007);
    2. Atribui formalmente o órgão municipal competente;
    3. Monta o cartão estruturado para revisão e confirmação humana pelo cidadão (Proposal versionada).
    """

    @classmethod
    def generate_confirmation(cls, session: AgentSession) -> ConfirmationCard:
        dept = session.department_name or "Ouvidoria - revisão humana do encaminhamento"
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
            f"A ficha da sua reclamação está pronta. O órgão sugerido é {dept}. "
            "Confira o resumo abaixo: confirme para registrar ou escolha ajustar e me diga na conversa o que precisa mudar."
        )

        session.approved_title = suggested_title
        session.approved_description = suggested_description
        session.is_ready_to_register = True
        session.state = "AWAITING_CONFIRMATION"
        if not session.proposal_id:
            session.proposal_id = f"proposal_{uuid.uuid4().hex[:12]}"

        proposal_data = {
            "id": session.proposal_id,
            "version": session.proposal_version,
            "department": {
                "id": session.department_id,
                "name": dept
            },
            "category": cat,
            "title": suggested_title,
            "description": suggested_description,
            "slots": dict(slots),
            "changed_fields": list(session.last_changed_fields) if session.last_changed_fields else None
        }
        session.current_proposal = proposal_data

        return ConfirmationCard(
            reply=reply,
            ready_to_register=True,
            department_name=dept,
            category=cat,
            suggested_title=suggested_title,
            suggested_description=suggested_description,
            proposal=proposal_data,
            proposal_version=session.proposal_version,
            state="AWAITING_CONFIRMATION"
        )
