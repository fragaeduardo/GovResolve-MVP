"""Triagem semantica opcional, com validacao contra o catalogo municipal.

Usada apenas quando regras rapidas nao identificam o assunto; nao grava demandas.
"""
import json
import logging
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field, ValidationError

from src.ai.agents.requirements_agent import RequirementsResult

logger = logging.getLogger("govresolve.ai.semantic_router")


class SemanticRoutingOutput(BaseModel):
    department_code: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: str = Field(min_length=3)


class SemanticRoutingAgent:
    @staticmethod
    def _catalog() -> dict:
        path = Path("data/departments.jsonl")
        if not path.exists():
            return {}
        result = {}
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                record = json.loads(line)
                result[record["code"]] = record
        return result

    @classmethod
    async def route(cls, report: str) -> Optional[RequirementsResult]:
        catalog = cls._catalog()
        if not catalog or not report.strip():
            return None

        choices = "\n".join(
            f'{code}: {entry["description"]}' for code, entry in catalog.items()
        )
        prompt = (
            "Voce e um agente de triagem de demandas municipais em portugues brasileiro. "
            "Escolha apenas UM codigo da lista abaixo. Responda somente JSON com "
            "department_code (str), confidence (numero entre 0 e 1), evidence "
            "(trecho literal do relato que sustenta a escolha). "
            "Se estiver incerto, use confidence abaixo de 0.75. "
            "Nao invente eventos nem informacoes.\n" + choices
        )
        # Import local para evitar dependencia circular com o Planner.
        from src.ai.service import AIScreeningService
        raw = await AIScreeningService.call_llm_with_fallback([
            {"role": "system", "content": prompt},
            {"role": "user", "content": report[:4000]}
        ], response_json=True)
        if not raw:
            return None
        try:
            decision = SemanticRoutingOutput.model_validate_json(raw.strip())
        except ValidationError:
            logger.warning("Resposta de triagem semantica fora do schema.")
            return None

        entry = catalog.get(decision.department_code)
        if (
            entry is None
            or decision.confidence < 0.75
            or decision.evidence.lower().strip() not in report.lower()
        ):
            return None

        # Adapta os requisitos ao dominio, sem confiar em campos inventados pelo LLM.
        local_codes = {"SEINFRA", "COMURG", "SET", "SANEAGO", "AMMA", "AGCM"}
        mandatory = ["logradouro", "bairro"] if decision.department_code in local_codes else ["relato"]
        if decision.department_code in {"SEINFRA", "SET"}:
            mandatory.append("referencia")

        return RequirementsResult(
            topic_identified=True,
            is_self_service=False,
            service_type="ATENDIMENTO_PUBLICO",
            department_name=entry["name"],
            category=entry["category"],
            problem_type=f"semantic_{decision.department_code.lower()}",
            mandatory_slots=mandatory,
            optional_slots=["detalhes"],
        )
