"""Benchmark do Qwen local para intenção e encaminhamento do GovResolve.

Requer AI_PROVIDER=omniroute, apenas ollama-local/qwen3.5:4b e chaves remotas vazias.
O arquivo de resultados inclui casos sintéticos, métricas agregadas e erros por caso.
"""

import argparse
import asyncio
import json
import statistics
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4

from src.ai.agents.department_routing_agent import DepartmentRoutingAgent
from src.config import settings

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "tests/data/triage_baseline_48.jsonl"
CHALLENGES = ROOT / "tests/data/triage_qwen_challenges.jsonl"
MODEL = "ollama-local/qwen3.5:4b"


def _read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _department_code(result: dict) -> str | None:
    return (result.get("department") or {}).get("code")


def _metrics(rows: list[dict], expected_key: str, actual_key: str) -> dict:
    confusion = Counter((row[expected_key] or "NONE", row[actual_key] or "NONE") for row in rows)
    classes = sorted({row[expected_key] or "NONE" for row in rows})
    per_class = {}
    for expected in classes:
        class_rows = [row for row in rows if (row[expected_key] or "NONE") == expected]
        hits = sum((row[actual_key] or "NONE") == expected for row in class_rows)
        per_class[expected] = {"correct": hits, "total": len(class_rows), "accuracy": hits / len(class_rows)}
    return {
        "correct": sum((row[expected_key] or "NONE") == (row[actual_key] or "NONE") for row in rows),
        "total": len(rows),
        "accuracy": sum((row[expected_key] or "NONE") == (row[actual_key] or "NONE") for row in rows) / len(rows) if rows else 0,
        "per_class": per_class,
        "confusion_matrix": {
            expected: {actual: count for (wanted, actual), count in sorted(confusion.items()) if wanted == expected}
            for expected in classes
        },
    }


def _percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    return round(ordered[min(len(ordered) - 1, int((len(ordered) - 1) * fraction))], 3)


async def _end_to_end() -> dict:
    from src.ai.agents.conversational_agent import ConversationalAgent
    from src.ai.agents.planner import Planner
    from src.ai.agents.session_store import SessionStore

    previous_memory_dir = settings.AGENT_MEMORY_DIR
    started = time.perf_counter()
    flows = {}
    with TemporaryDirectory(prefix="govresolve-qwen-benchmark-") as memory_dir:
        settings.AGENT_MEMORY_DIR = memory_dir
        try:
            old_report = "Tem um buraco grande no asfalto da minha rua."
            conversation = [{"role": "user", "content": old_report}]
            first = await Planner.process_turn(conversation, f"bench-{uuid4().hex[:12]}")
            conversation.extend([
                {"role": "assistant", "content": first["reply"]},
                {"role": "user", "content": "Rua T-36, no Setor Bueno"},
            ])
            second = await Planner.process_turn(conversation, first["session_id"])
            second_session = SessionStore.load(first["session_id"])
            no_repeat = not ConversationalAgent._asks_for_collected_slot(
                second["reply"], second_session, second.get("missing_slots", []), "Rua T-36, no Setor Bueno"
            )
            conversation.extend([
                {"role": "assistant", "content": second["reply"]},
                {"role": "user", "content": "Em frente ao número 450"},
            ])
            third = await Planner.process_turn(conversation, first["session_id"])
            slots = (third.get("proposal") or {}).get("slots", {})
            flows["three_turn_intake"] = {
                "pass": bool(
                    no_repeat and third.get("ready_to_register")
                    and (third.get("department_name") or "").startswith("SEINFRA")
                    and slots.get("logradouro") == "Rua T-36"
                    and slots.get("bairro") == "Setor Bueno"
                    and "450" in slots.get("referencia", "")
                ),
                "no_repeated_location_question": no_repeat,
                "ready_to_register": third.get("ready_to_register", False),
                "department": (third.get("department_name") or "").split(" — ")[0] or None,
                "slots": slots,
                "replies": [first["reply"], second["reply"], third["reply"]],
            }

            switch_id = f"bench-{uuid4().hex[:12]}"
            first_report = "Tem um buraco grande no asfalto."
            new_report = "Na verdade, esquece o buraco. Uma árvore caiu na Praça Cívica, no Setor Central, em frente ao coreto."
            first_switch = await Planner.process_turn(
                [{"role": "user", "content": first_report}], switch_id
            )
            switched = await Planner.process_turn([
                {"role": "assistant", "content": first_switch["reply"]},
                {"role": "user", "content": new_report},
            ], switch_id)
            switched_session = SessionStore.load(switch_id)
            active_reports = switched_session.get_topic_user_messages()
            description = switched.get("suggested_description", "")
            flows["explicit_topic_switch"] = {
                "pass": bool(
                    switched.get("ready_to_register")
                    and (switched.get("department_name") or "").startswith("COMURG")
                    and switched_session.topic_summary == new_report
                    and active_reports == [new_report]
                    and first_report not in description
                ),
                "ready_to_register": switched.get("ready_to_register", False),
                "department": (switched.get("department_name") or "").split(" — ")[0] or None,
                "summary_is_new_topic": switched_session.topic_summary == new_report,
                "active_report_isolated": active_reports == [new_report],
                "proposal_description": description,
            }
        finally:
            settings.AGENT_MEMORY_DIR = previous_memory_dir
    return {"duration_seconds": round(time.perf_counter() - started, 3), "flows": flows}


async def run(transport: str = "omniroute") -> dict:
    if settings.OPENAI_API_KEY or settings.GEMINI_API_KEY:
        raise RuntimeError("Benchmark abortado: chaves de provedores remotos precisam estar vazias.")
    host = settings.OMNIROUTE_BASE_URL
    if transport == "omniroute":
        if settings.AI_PROVIDER.strip().lower() != "omniroute" or settings.omniroute_model_list != [MODEL]:
            raise RuntimeError(f"Benchmark abortado: configure apenas OmniRoute com {MODEL}.")
        if not settings.OMNIROUTE_API_KEY:
            raise RuntimeError("Benchmark abortado: OMNIROUTE_API_KEY local ausente.")
        if not host.startswith(("http://localhost:", "http://127.0.0.1:")):
            raise RuntimeError("Benchmark abortado: OmniRoute precisa estar em loopback local.")
    elif transport == "ollama":
        import httpx
        from src.ai.service import AIScreeningService

        host = "http://127.0.0.1:11434/v1"

        async def local_qwen(cls, messages, response_json=True):
            payload = {
                "model": "qwen3.5:4b", "messages": messages,
                "temperature": 0.2, "max_tokens": 512, "reasoning_effort": "none",
            }
            if response_json:
                payload["response_format"] = {"type": "json_object"}
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(f"{host}/chat/completions", json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"].get("content")

        AIScreeningService.call_llm_with_fallback = classmethod(local_qwen)
    else:
        raise ValueError("transport precisa ser 'omniroute' ou 'ollama'.")

    baseline = _read_jsonl(BASELINE)
    challenges = _read_jsonl(CHALLENGES)
    assert len(baseline) == 48 and len({(c["text"], c["department_code"]) for c in baseline}) == 45
    assert len(challenges) == 24
    department_rows = []
    intent_rows = []
    latencies = []

    async def measured(call):
        started = time.perf_counter()
        result = await call
        elapsed = time.perf_counter() - started
        latencies.append(elapsed)
        return result, elapsed

    for index, case in enumerate(baseline, 1):
        sheet = json.dumps({
            "relato": [case["text"]],
            "campos": {
                "logradouro": "Rua de Teste",
                "bairro": "Setor Central",
                "referencia": "em frente ao marco de teste",
            },
        }, ensure_ascii=False)
        result, elapsed = await measured(DepartmentRoutingAgent.route(sheet, intent_only=False))
        department_rows.append({
            "text": case["text"],
            "expected": case["department_code"],
            "actual": _department_code(result),
            "intent": result.get("intent"),
            "seconds": round(elapsed, 3),
        })
        if index % 12 == 0:
            print(f"Encaminhamento: {index}/{len(baseline)}", flush=True)

    challenge_destination_rows = []
    for index, case in enumerate(challenges, 1):
        intent_result, elapsed = await measured(DepartmentRoutingAgent.route(case["text"], intent_only=True))
        intent_rows.append({
            "text": case["text"],
            "group": case["group"],
            "expected": case["expected_intent"],
            "actual": intent_result.get("intent", "UNCLEAR"),
            "seconds": round(elapsed, 3),
        })
        if case["expected_intent"] == "PUBLIC_COMPLAINT":
            sheet = json.dumps({
                "relato": [case["text"]],
                "campos": {
                    "logradouro": "Rua de Teste",
                    "bairro": "Setor Central",
                    "referencia": "em frente ao marco de teste",
                },
            }, ensure_ascii=False)
            route, elapsed = await measured(DepartmentRoutingAgent.route(sheet, intent_only=False))
            challenge_destination_rows.append({
                "text": case["text"],
                "group": case["group"],
                "expected": case["expected_department_code"],
                "actual": _department_code(route),
                "seconds": round(elapsed, 3),
            })
        if index % 8 == 0:
            print(f"Intenção: {index}/{len(challenges)}", flush=True)

    end_to_end = await _end_to_end()
    unique_baseline = list({(row["text"], row["expected"]): row for row in department_rows}.values())
    return {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "model": MODEL,
        "provider": "OmniRoute -> Ollama local" if transport == "omniroute" else "Ollama local (OpenAI-compatible endpoint)",
        "transport": transport,
        "host": host,
        "limitations": [
            "O baseline contém 48 linhas, mas somente 45 pares únicos texto/destino; métricas únicas deduplicam esses pares.",
            "Os endereços usados na etapa de encaminhamento são sintéticos e idênticos em todos os casos.",
            "Latência cobre apenas as chamadas de roteamento do lote; os fluxos ponta a ponta têm duração separada.",
            "OmniRoute retornou 503 resource_pressure no host; a avaliação do modelo foi feita pelo endpoint local nativo do Ollama.",
            "O rótulo COMURG para 'entulho no passeio' diverge do catálogo, que atribui descarte irregular de entulho à AMMA.",
        ],
        "latency_seconds": {
            "calls": len(latencies),
            "mean": round(statistics.mean(latencies), 3) if latencies else None,
            "p50": _percentile(latencies, 0.50),
            "p95": _percentile(latencies, 0.95),
        },
        "baseline_department_48": _metrics(department_rows, "expected", "actual"),
        "baseline_department_unique": _metrics(unique_baseline, "expected", "actual"),
        "challenge_intents": _metrics(intent_rows, "expected", "actual"),
        "challenge_departments": _metrics(challenge_destination_rows, "expected", "actual"),
        "end_to_end": end_to_end,
        "errors": {
            "baseline_department": [row for row in department_rows if row["expected"] != row["actual"]],
            "challenge_intent": [row for row in intent_rows if row["expected"] != row["actual"]],
            "challenge_department": [row for row in challenge_destination_rows if row["expected"] != row["actual"]],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    parser.add_argument("--transport", choices=("omniroute", "ollama"), default="omniroute")
    args = parser.parse_args()
    report = asyncio.run(run(args.transport))
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()
