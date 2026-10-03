import json
import logging
from typing import Optional
import httpx
from pydantic import BaseModel

from src.config import settings
from src.db.schema import DemandSeverity

logger = logging.getLogger("govresolve.ai.severity")


class SeverityResult(BaseModel):
    severity: DemandSeverity
    severity_justification: str


class SeverityClassificationAgent:
    """
    Agente Especialista de Classificação de Gravidade Operacional.
    
    Responsabilidade:
    - Analisa a demanda estruturada pós-aprovação do cidadão (Human-in-the-Loop).
    - Classifica a gravidade em 4 níveis (CRITICA, ALTA, MEDIA, BAIXA).
    - Emite justificativa técnica detalhada e objetiva conforme a Matriz de Gravidade Municipal.
    """

    CRITICAL_KEYWORDS = [
        "desabamento", "desmoronamento", "soterramento", "fio de alta tensão", "fio energizado",
        "fiação exposta", "fiação solta", "choque elétrico", "cratera aberta", "cratera na pista",
        "poste caindo", "poste inclinado", "árvore sobre casa", "vazamento de gás",
        "vazamento químico", "afundamento de asfalto", "grave risco à vida", "risco de morte",
        "iminente queda", "iminente desabamento", "intoxicação", "explosão"
    ]

    HIGH_KEYWORDS = [
        "bloqueada", "interditada", "via arterial", "avenida principal", "semáforo apagado",
        "semáforo quebrado", "cruzamento perigoso", "esgoto a céu aberto", "esgoto invadindo",
        "contaminação", "falta de água geral", "posto de saúde sem", "upa sem atendimento",
        "falta de remédio urgente", "alagamento de via", "lixo hospitalar", "merenda escolar",
        "árvore caída na pista", "acidente grave", "falta geral de energia", "rompimento de adutora"
    ]

    LOW_KEYWORDS = [
        "pintura de meio-fio", "guia desgastada", "capina", "roçagem", "mato alto",
        "lixeira pública", "banco de praça", "folhas caídas", "placa desbotada",
        "placa informativa", "revitalização estética", "paisagismo", "varrição preventiva",
        "sugestão de instalação"
    ]

    @classmethod
    def classify_deterministic(
        cls,
        title: str,
        description: str,
        category: Optional[str] = None
    ) -> SeverityResult:
        """Classificador determinístico baseado na Matriz de Risco e Impacto Urbano."""
        text = f"{title} {description}".lower()

        # 1. Checagem de Nível Crítico (Risco Iminente à Vida e Desastre Estrutural)
        for kw in cls.CRITICAL_KEYWORDS:
            if kw in text:
                return SeverityResult(
                    severity=DemandSeverity.CRITICA,
                    severity_justification=(
                        f"Classificada como CRÍTICA devido ao fator de risco identificado ('{kw}'). "
                        "Configura risco iminente à integridade física, tráfego expresso ou perigo coletivo agudo, "
                        "exigindo mobilização e despacho emergencial em até 24 horas."
                    )
                )

        # 2. Checagem de Nível Alto (Impacto Coletivo Severo ou Parada de Serviços Essenciais)
        for kw in cls.HIGH_KEYWORDS:
            if kw in text:
                return SeverityResult(
                    severity=DemandSeverity.ALTA,
                    severity_justification=(
                        f"Classificada como ALTA pelo impacto coletivo verificado ('{kw}'). "
                        "Afeta a circulação em corredores principais, rede sanitária vulnerável ou "
                        "equipamentos públicos de atendimento essencial, com SLA prioritário de até 48 horas."
                    )
                )

        # 3. Checagem de Nível Baixo (Manutenção Preventiva, Estética ou Zeladoria Leve)
        for kw in cls.LOW_KEYWORDS:
            if kw in text:
                return SeverityResult(
                    severity=DemandSeverity.BAIXA,
                    severity_justification=(
                        f"Classificada como BAIXA por se referir a manutenção preventiva ou aspecto estético ('{kw}'). "
                        "Não causa interrupção funcional imediata nem oferece risco aos munícipes, "
                        "com atendimento programado em até 15 dias úteis."
                    )
                )

        # 4. Padrão: Média (Zeladoria urbana rotineira, vias secundárias, iluminação comum)
        return SeverityResult(
            severity=DemandSeverity.MEDIA,
            severity_justification=(
                "Classificada como MÉDIA conforme o padrão de zeladoria urbana municipal. "
                "Trata-se de ocorrência funcional localizada sem ameaça iminente à vida ou paralisação de grandes vias, "
                "com prazo regulamentar de atendimento entre 5 a 7 dias úteis."
            )
        )

    @classmethod
    async def classify_demand(
        cls,
        title: str,
        description: str,
        category: Optional[str] = None,
        department_name: Optional[str] = None
    ) -> SeverityResult:
        """
        Classifica a gravidade da demanda após aprovação humana.
        Tenta avaliação semântica via OmniRoute LLM com fallback imediato no motor determinístico.
        """
        prompt_text = (
            f"Você é o Agente Especialista de Classificação de Gravidade Operacional do GovResolve.\n"
            f"Sua missão é classificar a severidade desta solicitação pública já aprovada pelo cidadão:\n"
            f"- Título: {title}\n"
            f"- Descrição: {description}\n"
            f"- Categoria: {category or 'Geral'}\n"
            f"- Órgão Responsável: {department_name or 'Municipal'}\n\n"
            f"Critérios de Severidade:\n"
            f"1. CRITICA: Risco iminente à vida, desabamento, choque elétrico em via pública, crateras em vias rápidas, vazamento tóxico. SLA: até 24h.\n"
            f"2. ALTA: Bloqueio de vias arteriais/principais, esgoto a céu aberto em áreas de alto fluxo, falta coletiva de água/energia, semáforo apagado em cruzamento. SLA: até 48h.\n"
            f"3. MEDIA: Buracos comuns em vias residenciais, lâmpada queimada em poste local, vazamento de água na calçada, atrasos de ônibus. SLA: 5-7 dias úteis.\n"
            f"4. BAIXA: Pintura de meio-fio, roçagem/capina de mato alto em calçada, nova lixeira pública, placa informativa desgastada. SLA: até 15 dias úteis.\n\n"
            f"Responda EXCLUSIVAMENTE em formato JSON:\n"
            f'{{"severity": "CRITICA" | "ALTA" | "MEDIA" | "BAIXA", "severity_justification": "Texto claro e fundamentado justificando a classificação."}}'
        )

        try:
            headers = {
                "Authorization": f"Bearer {settings.OMNIROUTE_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.omniroute_model_list[0] if settings.omniroute_model_list else "auto/fast",
                "messages": [
                    {"role": "system", "content": "Você é um classificador pericial de risco urbano. Responda em JSON válido."},
                    {"role": "user", "content": prompt_text}
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"}
            }

            async with httpx.AsyncClient(timeout=1.5) as client:
                resp = await client.post(
                    f"{settings.OMNIROUTE_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    sev_str = str(parsed.get("severity", "")).upper()
                    if sev_str in ["CRITICA", "ALTA", "MEDIA", "BAIXA"]:
                        return SeverityResult(
                            severity=DemandSeverity(sev_str),
                            severity_justification=parsed.get(
                                "severity_justification",
                                f"Classificação {sev_str} atribuída com base na análise técnica de impacto."
                            )
                        )
        except Exception as e:
            logger.info(f"[SeverityAgent] Usando classificador determinístico: {e}")

        # Fallback determinístico garantido
        return cls.classify_deterministic(title, description, category)
