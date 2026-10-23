"""Baseline offline e reproduzivel para triagem deterministica do GovResolve.

Uso: python -m scripts.evaluate_triage
Nao mede desempenho ponta-a-ponta dos modelos LLM.
"""
import json
from collections import Counter
from pathlib import Path

from src.ai.agents.requirements_agent import RequirementsAgent

DATASET_PATH = Path("tests/data/triage_baseline_48.jsonl")


def evaluate(path: Path = DATASET_PATH) -> dict:
    cases = [
        json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    confusions = Counter()
    correct = 0
    for case in cases:
        decision = RequirementsAgent.analyze(case["text"])
        actual = (decision.department_name or "").split(" — ")[0]
        if case["department_code"] == "ILUMINACAO" and "Iluminação Pública" in (decision.department_name or ""):
            actual = "ILUMINACAO"
        if case["department_code"] == "PROCON" and "PROCON" in (decision.department_name or ""):
            actual = "PROCON"
        if actual == case["department_code"]:
            correct += 1
        else:
            confusions[(case["department_code"], actual or "INDEFINIDO")] += 1

    return {
        "total": len(cases),
        "correct": correct,
        "accuracy": correct / len(cases) if cases else 0.0,
        "errors": [
            {"expected": expected, "actual": actual, "count": count}
            for (expected, actual), count in sorted(confusions.items())
        ],
    }


if __name__ == "__main__":
    print(json.dumps(evaluate(), ensure_ascii=False, indent=2))
