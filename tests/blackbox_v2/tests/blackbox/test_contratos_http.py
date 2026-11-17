"""Caixa-preta: testes HTTP vinculados à especificação pré-existente do GovResolve.

Não importa o código interno do SUT. Não executa testes sem API definida.
Testes que podem escrever no banco de homologação exigem liberação explícita.

    GOVRESOLVE_BASE_URL=http://127.0.0.1:8000
    GOVRESOLVE_TEST_ALLOW_WRITES=1  # somente em banco descartável isolado

Asserções de 4xx refletem recusa no transporte HTTP, NÃO estabelecem novo RF.
A suíte principal de 61 casos está em casos_de_teste_estritos.csv.
"""
import os
from urllib.parse import urlparse

import httpx
import pytest

ROOT = "/api/v1"
BASE_URL = os.getenv("GOVRESOLVE_BASE_URL", "").rstrip("/")
ALLOW_WRITES = os.getenv("GOVRESOLVE_TEST_ALLOW_WRITES") == "1"


def _rejects(response: httpx.Response):
    assert 400 <= response.status_code < 500, (
        f"Uma solicitação sem autorização/dados mínimos não foi rejeitada: HTTP {response.status_code}."
    )


def _isolated_env():
    if not ALLOW_WRITES:
        pytest.skip("Login de demonstração e POSTs exigem GOVRESOLVE_TEST_ALLOW_WRITES=1 em banco de teste descartável.")
    host = urlparse(BASE_URL).hostname
    if host not in {"localhost", "127.0.0.1", "::1"}:
        pytest.skip("Somente host local para operações que podem gravar em banco (proteção da suíte).")


@pytest.fixture(scope="module")
def api():
    if not BASE_URL:
        pytest.skip("Sem GOVRESOLVE_BASE_URL: não há SUT em execução para validar.")
    with httpx.Client(base_url=BASE_URL, timeout=15, follow_redirects=False) as client:
        try:
            status = client.get("/health")
        except httpx.RequestError as e:
            pytest.skip(f"API indisponível: {e}")
        if status.status_code != 200:
            pytest.skip("API sem health utilizável")
        yield client


@pytest.fixture
def demo_citizen(api):
    _isolated_env()
    conf = api.get(ROOT + "/auth/demo-config")
    assert conf.status_code == 200
    if not conf.json().get("enabled"):
        pytest.skip("Modo demo indisponível na instalação testada")
    response = api.post(ROOT + "/auth/demo", json={"role": "cidadao"})
    assert response.status_code == 200
    token = response.json().get("access_token")
    assert token, "O perfil demonstrativo não retornou token"
    return token


def headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_CT_AUT_08_nao_expor_demandas_sem_autenticacao(api):
    """RF013 + exclusão de acesso não autenticado no backlog."""
    response = api.get(ROOT + "/demands/my")
    _rejects(response)


def test_CT_AUT_09_nao_expor_perfil_com_credencial_invalida(api):
    """RF013: credencial inválida não fornece acesso a dados protegidos."""
    response = api.get(ROOT + "/auth/me", headers=headers("token-invalido"))
    _rejects(response)


def test_CT_REG_11_nao_registrar_demanda_anonima(api):
    """RF002 + backlog: acesso não autenticado ao registro fica fora do escopo."""
    _isolated_env()  # se surgir uma regressão, este POST poderia inserir dados
    response = api.post(ROOT + "/demands", json={
        "title": "Demanda demonstrativa", "description": "Ocorrência inteiramente fictícia para homologação."
    })
    _rejects(response)


def test_CT_AUT_01_cidadao_demo_reconhecido_como_cidadao(api, demo_citizen):
    """Observação do MVP: acesso demonstrativo deve manter perfil cidadão."""
    response = api.get(ROOT + "/auth/me", headers=headers(demo_citizen))
    assert response.status_code == 200
    assert response.json().get("role") == "cidadao"


def test_CT_AUT_10_cidadao_nao_recebe_permissoes_de_tratamento(api, demo_citizen):
    """RF013; a interface pode apresentar perfil, mas não habilitar tratamento."""
    response = api.get(ROOT + "/auth/me", headers=headers(demo_citizen))
    assert response.status_code == 200
    roles = response.json().get("roles", [])
    assert "servidor" not in roles and "gestor" not in roles


def test_CT_ADM_01_cidadao_sem_acesso_a_fila(api, demo_citizen):
    """RF011/RF013."""
    _rejects(api.get(ROOT + "/admin/demands", headers=headers(demo_citizen)))


def test_CT_ADM_02_cidadao_nao_pode_alterar_status(api, demo_citizen):
    """RF012/RF013: exigida demanda existente, evitando falso positivo por protocolo inexistente."""
    _isolated_env()
    protocol = os.getenv("GOVRESOLVE_TEST_PROTOCOL_OF_DEMO_CITIZEN")
    if not protocol:
        pytest.skip("Forneça GOVRESOLVE_TEST_PROTOCOL_OF_DEMO_CITIZEN: protocolo REAL do cidadão demo no banco isolado.")
    before = api.get(ROOT + "/demands/" + protocol, headers=headers(demo_citizen))
    if before.status_code != 200:
        pytest.skip("Protocolo não pertence ao cidadão demonstrativo ou não é consultável.")
    previous_status = before.json()["status"]
    response = api.patch(ROOT + "/admin/demands/" + protocol + "/status",
        headers=headers(demo_citizen), json={"new_status": "FECHADO", "resolution_notes": "Resultado sintético de teste"})
    _rejects(response)
    after = api.get(ROOT + "/demands/" + protocol, headers=headers(demo_citizen))
    assert after.status_code == 200 and after.json()["status"] == previous_status


def test_CT_REG_12_nao_aceitar_corpo_sem_informacoes_obrigatorias(api, demo_citizen):
    """RF002: registro incompleto não é concluído."""
    _isolated_env()
    response = api.post(ROOT + "/demands", headers=headers(demo_citizen), json={})
    _rejects(response)
