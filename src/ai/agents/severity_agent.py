import json
import logging
from typing import Optional

from pydantic import BaseModel

from src.ai.service import AIScreeningService
from src.db.schema import DemandSeverity

logger = logging.getLogger("govresolve.ai.severity")


class SeverityResult(BaseModel):
    severity: DemandSeverity
    severity_justification: str


class SeverityClassificationAgent:
    """Classifica gravidade pela avaliação contextual da IA, sem listas de palavras."""

    @classmethod
    async def classify_demand(
        cls,
        title: str,
        description: str,
        category: Optional[str] = None,
        department_name: Optional[str] = None,
    ) -> SeverityResult:
        prompt = (
            "Avalie a gravidade operacional usando o contexto completo, a extensão do impacto, a urgência e os riscos "
            "descritos. Não infira fatos ausentes nem classifique apenas por uma palavra isolada. Se faltarem dados, "
            "considere essa incerteza na justificativa. Níveis: CRITICA (risco iminente à vida ou desastre), ALTA "
            "(impacto coletivo severo ou serviço essencial interrompido), MEDIA (impacto localizado que requer ação), "
            "BAIXA (manutenção preventiva ou impacto reduzido). Não prometa prazo de atendimento.\n\n"
            f"Título: {title}\nDescrição: {description}\nCategoria: {category or 'não informada'}\n"
            f"Órgão: {department_name or 'não informado'}\n\n"
            'Retorne JSON: {"severity":"CRITICA|ALTA|MEDIA|BAIXA", "severity_justification":"..."}'
        )
        try:
            answer = await AIScreeningService.call_llm_with_fallback([
                {"role": "system", "content": "Classificador de risco municipal. Responda apenas JSON válido."},
                {"role": "user", "content": prompt},
            ], response_json=True)
            data = json.loads(answer or "{}")
            if not isinstance(data, dict):
                raise ValueError("Resposta deve ser um objeto JSON")
            severity = DemandSeverity(str(data.get("severity", "")).upper())
            justification = str(data.get("severity_justification", "")).strip()
            if justification:
                return SeverityResult(severity=severity, severity_justification=justification)
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            logger.info("Severity classification unavailable or invalid: %s", exc)

        # O banco exige um nível; a justificativa impede que o fallback pareça avaliação concluída.
        return SeverityResult(
            severity=DemandSeverity.MEDIA,
            severity_justification=(
                "Classificação automática indisponível. Gravidade provisória atribuída para permitir o registro; "
                "requer triagem humana e não representa avaliação de risco concluída."
            ),
        )
