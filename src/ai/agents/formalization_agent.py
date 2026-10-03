import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.schema import Department, DemandSeverity, ServiceType, User
from src.api.schemas import DemandResponse
from src.ai.agents.session_store import SessionStore, AgentSession
from src.ai.agents.severity_agent import SeverityClassificationAgent
from src.ai.tools.demand_tool import DemandRegistrationTool, RegisterDemandInput

logger = logging.getLogger("govresolve.ai.formalization")


class FormalizationResult(BaseModel):
    success: bool
    protocol: str
    department_name: str
    category: str
    severity: str
    severity_justification: Optional[str] = None
    status: str
    title: str
    description: str
    reply: str
    tracking: Dict[str, Any]
    demand: DemandResponse


class FormalizationAgent:
    """
    Agente de Formalização e Execução de Tools (Pós-Aprovação Humana).
    
    Responsabilidades:
    1. Recebe a solicitação aprovada pelo cidadão (Human-in-the-Loop);
    2. Define e confirma o órgão municipal competente de destino;
    3. Aciona o especialista de gravidade para classificar o nível de urgência/risco;
    4. Executa a Tool 'DemandRegistrationTool' para persistir a demanda no banco relacional;
    5. Retorna no chat a mensagem de formalização rápida e estruturada, liberando
       imediatamente o acompanhamento em tempo real para o cidadão.
    """

    @classmethod
    async def formalize_and_register(
        cls,
        db: AsyncSession,
        citizen: User,
        session_id: Optional[str] = None,
        title: Optional[str] = None,
        description: Optional[str] = None
    ) -> FormalizationResult:
        logger.info(f"[FormalizationAgent] Iniciando formalização pós-aprovação humana para cidadão ID={citizen.id}")

        session: Optional[AgentSession] = None
        if session_id:
            session = SessionStore.load(session_id)

        # 1. Obtenção do título e descrição factual aprovados
        final_title = title
        final_description = description
        category = "Zeladoria Urbana"
        department_hint = None

        if session:
            category = session.category or category
            department_hint = session.department_name
            if not final_title:
                logradouro = session.collected_slots.get("logradouro", "Localidade")
                final_title = f"{category}: {logradouro}"
            if not final_description:
                user_msgs = [m["content"] for m in session.messages if m.get("role") == "user"]
                parts = []
                if "logradouro" in session.collected_slots:
                    parts.append(f"Endereço: {session.collected_slots.get('logradouro')}, {session.collected_slots.get('bairro', '')}.")
                if "referencia" in session.collected_slots:
                    parts.append(f"Referência: {session.collected_slots.get('referencia')}.")
                if "detalhes" in session.collected_slots:
                    parts.append(f"Detalhes: {session.collected_slots.get('detalhes')}.")
                parts.append(f"Relato do cidadão: {' | '.join(user_msgs)}.")
                final_description = " ".join(parts)

        if not final_title:
            final_title = "Solicitação de Zeladoria Urbana"
        if not final_description:
            final_description = "Demanda registrada e aprovada pelo cidadão via portal inteligente."

        # 2. Escolha e validação do órgão destinatário no banco de dados
        target_dept: Optional[Department] = None
        if department_hint:
            # Buscar pelo nome ou sigla (ex: SMM, SEINFRA, COMURG)
            search_term = department_hint.split("—")[0].strip() if "—" in department_hint else department_hint
            dept_res = await db.execute(
                select(Department).where(Department.name.ilike(f"%{search_term}%"))
            )
            target_dept = dept_res.scalars().first()

        if not target_dept:
            # Fallback buscando o primeiro departamento
            first_dept = await db.execute(select(Department))
            target_dept = first_dept.scalars().first()

        dept_id = target_dept.id if target_dept else None
        dept_name = target_dept.name if target_dept else (department_hint or "Secretaria Municipal de Infraestrutura Urbana")

        # 3. Classificação de gravidade pelo especialista de gravidade
        logger.info(f"[FormalizationAgent] Classificando gravidade para '{final_title}'...")
        severity_result = await SeverityClassificationAgent.classify_demand(
            title=final_title,
            description=final_description,
            category=category,
            department_name=dept_name
        )
        logger.info(f"[FormalizationAgent] Gravidade avaliada: {severity_result.severity.value} - Justificativa: {severity_result.severity_justification}")

        # 4. Execução da Tool de Registro no Banco de Dados Relacional
        logger.info(f"[FormalizationAgent] Acionando tool '{DemandRegistrationTool.name}'...")
        tool_input = RegisterDemandInput(
            title=final_title,
            description=final_description,
            department_id=dept_id,
            department_name=dept_name,
            severity=severity_result.severity,
            severity_justification=severity_result.severity_justification,
            category=category,
            service_type=ServiceType.ATENDIMENTO_PUBLICO,
            organized_summary=f"Demanda para {dept_name} com prioridade {severity_result.severity.value}."
        )

        tool_result = await DemandRegistrationTool.execute(
            db=db,
            payload=tool_input,
            citizen=citizen
        )

        if not tool_result.success or not tool_result.demand:
            raise RuntimeError(f"Falha na execução da tool de persistência: {tool_result.message}")

        created_demand = tool_result.demand
        protocol = created_demand.protocol

        # 5. Formatação da mensagem rápida de formalização para o chat
        reply = (
            f"Sua demanda foi formalizada com sucesso e registrada no sistema da Prefeitura sob o protocolo oficial {protocol}. "
            f"O chamado foi encaminhado à {dept_name} com nível de gravidade classificado como {created_demand.severity.value}. "
            f"Você já pode acompanhar a tramitação diretamente abaixo."
        )

        tracking_data = {
            "protocol": protocol,
            "status": created_demand.status.value,
            "department_name": dept_name,
            "severity": created_demand.severity.value,
            "severity_justification": created_demand.severity_justification,
            "created_at": created_demand.created_at.isoformat() if created_demand.created_at else datetime.now().isoformat(),
            "category": category,
            "title": created_demand.title
        }

        # Atualizar a sessão se existir
        if session:
            session.messages.append({"role": "assistant", "content": reply})
            SessionStore.save(session)

        return FormalizationResult(
            success=True,
            protocol=protocol,
            department_name=dept_name,
            category=category,
            severity=created_demand.severity.value,
            severity_justification=created_demand.severity_justification,
            status=created_demand.status.value,
            title=created_demand.title,
            description=created_demand.description,
            reply=reply,
            tracking=tracking_data,
            demand=created_demand
        )
