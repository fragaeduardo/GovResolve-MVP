from scripts.evaluate_triage import evaluate


def test_deterministic_triage_baseline():
    result = evaluate()
    assert result["total"] == 48
    # Smoke baseline (dados sinteticos e simples), nao equivale a qualidade em producao.
    assert result["accuracy"] >= 0.95, result["errors"]
