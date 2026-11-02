import pytest
from src.ai.service import AIScreeningService
from src.config import settings
from src.db.schema import ServiceType


@pytest.mark.asyncio
async def test_ai_screening_identifies_self_service():
    """Valida identificação de autoatendimento para serviços resolvíveis diretamente pelo cidadão (RF006, RF007)."""
    title = "Preciso da 2ª via do meu IPTU deste ano"
    desc = "Não recebi o carnê do IPTU da minha casa e gostaria de emitir a segunda via do boleto para pagamento."

    result = await AIScreeningService.screen_demand(title, desc)

    assert result.service_type == ServiceType.AUTOATENDIMENTO
    assert result.self_service_link is None
    assert result.self_service_instructions is not None
    assert len(result.self_service_instructions) > 10


@pytest.mark.asyncio
async def test_ai_screening_identifies_public_service():
    """Valida identificação de atendimento público para serviços que exigem atuação de servidor (RF006, RF008)."""
    title = "Buraco perigoso na avenida principal"
    desc = "Há uma cratera na Av. Goiás após as chuvas que já furou o pneu de dois carros. Solicito reparo urgente."

    result = await AIScreeningService.screen_demand(title, desc)

    assert result.service_type == ServiceType.ATENDIMENTO_PUBLICO
    assert result.self_service_link is None
    assert result.self_service_instructions is None
    assert result.category in ["Infraestrutura Urbana", "Serviços Gerais", "Obras e Pavimentação"]
    assert "Infraestrutura" in result.department_name or "SEINFRA" in result.department_name or "Obras" in result.department_name


@pytest.mark.asyncio
async def test_ai_screening_factual_fidelity():
    """Garante fidelidade factual do resumo organizado, sem acréscimo de alucinações (RF009, RNF007)."""
    title = "Falta de medicamentos de pressão na UBS Centro"
    desc = "Minha mãe foi buscar Losartana na UBS Central no dia 01/10 e o atendente informou falta de estoque."

    result = await AIScreeningService.screen_demand(title, desc)

    # Verifica se os fatos essenciais constam no resumo e se não foram distorcidos
    assert "Losartana" in result.organized_summary or "Falta de medicamentos" in result.organized_summary
    assert "UBS" in result.organized_summary
    assert result.service_type == ServiceType.ATENDIMENTO_PUBLICO


@pytest.mark.asyncio
async def test_openai_failure_retries_with_omniroute(monkeypatch):
    import src.ai.service as ai_service

    calls = []

    class Response:
        def __init__(self, status_code, content=None):
            self.status_code = status_code
            self.content = content

        def raise_for_status(self):
            if self.status_code >= 400:
                raise RuntimeError("provider unavailable")

        def json(self):
            return {"choices": [{"message": {"content": self.content}}]}

    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, **kwargs):
            calls.append(url)
            if "api.openai.com" in url:
                return Response(503)
            return Response(200, "Resposta do OmniRoute")

    monkeypatch.setattr(ai_service.httpx, "AsyncClient", lambda **kwargs: Client())
    monkeypatch.setattr(settings, "AI_PROVIDER", "openai")
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "test-openai-key")
    monkeypatch.setattr(settings, "OMNIROUTE_API_KEY", "test-omniroute-key")
    monkeypatch.setattr(settings, "OMNIROUTE_MODELS", "test/fast")

    answer = await AIScreeningService.call_llm_with_fallback(
        [{"role": "user", "content": "Oi"}], response_json=False
    )

    assert answer == "Resposta do OmniRoute"
    assert calls == [
        "https://api.openai.com/v1/chat/completions",
        "http://localhost:20128/v1/chat/completions"
    ]
