import pytest
from src.ai.agents.severity_agent import SeverityClassificationAgent
from src.db.schema import DemandSeverity


@pytest.mark.asyncio
async def test_severity_classification_critical():
    """Valida classificação CRÍTICA para risco iminente à vida, desabamento ou choque elétrico."""
    title = "Fiação viva caída na calçada soltando faíscas"
    desc = "Rua das Palmeiras, 45, Centro. Um fio de alta tensão partiu e está energizado no chão com grave risco à vida."

    result = await SeverityClassificationAgent.classify_demand(title, desc, "Iluminação e Energia")

    assert result.severity == DemandSeverity.CRITICA
    assert "CRÍTICA" in result.severity_justification or "24 horas" in result.severity_justification


@pytest.mark.asyncio
async def test_severity_classification_high():
    """Valida classificação ALTA para interrupção de vias principais, adutoras ou esgoto a céu aberto."""
    title = "Esgoto a céu aberto invadindo portão de escola"
    desc = "Av. Brasil, 500, Setor Sul. Rompimento de esgoto com contaminação em frente à creche municipal."

    result = await SeverityClassificationAgent.classify_demand(title, desc, "Saneamento")

    assert result.severity == DemandSeverity.ALTA
    assert "ALTA" in result.severity_justification or "48 horas" in result.severity_justification


@pytest.mark.asyncio
async def test_severity_classification_medium():
    """Valida classificação MÉDIA para zeladoria rotineira sem colapso ou perigo imediato à vida."""
    title = "Buraco no asfalto em rua residencial"
    desc = "Rua 10, 150, Jardim Goiás. Buraco na via atrapalhando os veículos que passam no local."

    result = await SeverityClassificationAgent.classify_demand(title, desc, "Obras e Pavimentação")

    assert result.severity == DemandSeverity.MEDIA
    assert "MÉDIA" in result.severity_justification or "5 a 7 dias" in result.severity_justification


@pytest.mark.asyncio
async def test_severity_classification_low():
    """Valida classificação BAIXA para manutenção preventiva e estética urbana."""
    title = "Pintura de meio-fio desgastada na praça"
    desc = "Praça Cívica, s/n, Centro. Solicito a revitalização estética com pintura de meio-fio e roçagem de mato baixo."

    result = await SeverityClassificationAgent.classify_demand(title, desc, "Limpeza Urbana")

    assert result.severity == DemandSeverity.BAIXA
    assert "BAIXA" in result.severity_justification or "15 dias" in result.severity_justification
