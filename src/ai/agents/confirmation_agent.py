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
        dept = session.department_name or "Órgão Municipal Competente"
        cat = session.category or "Zeladoria Urbana"
        slots = session.collected_slots

        logradouro = slots.get("logradouro", "Local não especificado")
        bairro = slots.get("bairro", "Bairro a confirmar")
        referencia = slots.get("referencia", "Sem ponto de referência adicional")
        detalhes = slots.get("detalhes", "")

        user_msgs = [m["content"] for m in session.messages if m["role"] == "user"]
        initial_report = user_msgs[0] if user_msgs else "Relato do cidadão"

        # Título objetivo e profissional
        suggested_title = f"{cat}: {logradouro}, {bairro}"
        if len(suggested_title) > 80:
            suggested_title = f"{cat}: {logradouro}"

        # Descrição rica e factual sem invenções
        desc_parts = [
            f"Endereço: {logradouro}, {bairro}.",
            f"Referência / Número: {referencia}."
        ]
        if detalhes:
            desc_parts.append(f"Observações: {detalhes}.")
        desc_parts.append(f"Histórico do relato: {' | '.join(user_msgs)}.")
        suggested_description = " ".join(desc_parts)

        reply = (
            f"Excelente! Reuni todas as informações necessárias para formalizar sua solicitação. "
            f"Estruturei os dados para encaminhamento direto à {dept}. "
            f"Por favor, confira o resumo no cartão abaixo e clique em 'Confirmar e Gerar Protocolo' para registrar a demanda no sistema oficial."
        )

        session.is_ready_to_register = True

        return ConfirmationCard(
            reply=reply,
            ready_to_register=True,
            department_name=dept,
            category=cat,
            suggested_title=suggested_title,
            suggested_description=suggested_description
        )
