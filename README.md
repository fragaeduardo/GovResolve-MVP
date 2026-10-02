<div align="center">

# GovResolve (MVP)

**Plataforma Inteligente de Gestão, Triagem e Encaminhamento de Demandas Públicas**

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![Tests Passing](https://img.shields.io/badge/tests-9%20passed-brightgreen.svg)](#-testes-automatizados)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-blue.svg)](#-acessibilidade)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📌 Sobre o Projeto

O **GovResolve** é uma plataforma centralizada desenvolvida para modernizar a gestão de reclamações e solicitações dos cidadãos aos órgãos públicos municipais. Através de inteligência artificial assistiva e fluxos de atendimento bem definidos, o sistema agiliza a triagem, orienta o cidadão em serviços de autoatendimento e encaminha demandas complexas diretamente aos setores competentes da administração pública.

### 👥 Equipe do Projeto — Grupo 10 (Ctrl+Z)
- **Eduardo Fraga Pereira** — 202405847
- **Ralph dos Reis Torres** — 202406925
- **Samuel Amorim Jaime** — 202205559
- **Wender Viana Faria Santos** — 202401832

*Disciplina: Engenharia de Software — Bacharelado em Ciência da Computação (INF / UFG)*

---

## 🎯 Problema e Objetivos

- **Problema:** Ineficiência, lentidão e falta de transparência no recebimento, classificação e encaminhamento manual de reclamações e solicitações da população.
- **Objetivo:** Organizar e dar total rastreabilidade ao ciclo de vida das demandas, desde o registro com protocolo único imediato até a resposta final pelo setor responsável.
- **Diferencial com IA:** Classificação automática do serviço, separação de demandas que admitem autoatendimento (com fornecimento imediato de links e orientações) e síntese estruturada dos fatos para os servidores públicos, sem distorção dos relatos.

---

## 🚀 Fluxos Principais

1. **Autoatendimento:** Quando a IA identifica que o serviço pode ser executado diretamente pelo cidadão, o sistema orienta o procedimento e fornece o link oficial correspondente.
2. **Atendimento Público:** Quando exige intervenção da administração:
   - A demanda é classificada e suas informações são estruturadas pela IA;
   - É encaminhada ao setor governamental competente;
   - O servidor público assume o atendimento (`ABERTO → EM ANDAMENTO → FECHADO`);
   - Ao concluir, o servidor registra o parecer oficial;
   - O cidadão é notificado por e-mail a cada alteração e pode avaliar o serviço.

> [!NOTE]
> Em estrita conformidade com a governança pública, a IA atua apenas como suporte preparatório: **não altera status**, **não emite atos administrativos** e **não realiza encerramento automático** de demandas.

---

## 🏗️ Arquitetura do Repositório

A estrutura segue o padrão de **Arquitetura de Repositórios**, separando responsabilidades de forma clara e modular:

```text
GovResolve-MVP/
├── docs/                           # Documentação técnica e de conformidade
│   ├── assets/                     # Identidade visual e logos do GovResolve
│   ├── arquitetura.md              # Visão arquitetural, fluxo de dados e RBAC
│   ├── especificacao-requisitos.md # RF001 a RF015, RNFs e Histórias de Usuário
│   ├── backlog-moscow.md           # Priorização MoSCoW e limites do escopo
│   ├── elicitacao.md               # Técnicas de elicitação e mapa de stakeholders
│   └── matriz-rastreabilidade.md   # Matriz de conformidade dos requisitos
├── frontend/                       # Aplicação Web (React + Vite + Tailwind)
│   ├── public/                     # Assets estáticos
│   ├── src/
│   │   ├── components/             # Header, CitizenPortal e ServerPanel
│   │   ├── services/               # Cliente HTTP da API REST (api.ts)
│   │   ├── styles/                 # Estilos globais e alto contraste (WCAG 2.1 AA)
│   │   ├── App.tsx                 # Composição principal e controle de perfis
│   │   └── main.tsx                # Entrypoint React
│   ├── index.html                  # Template HTML5 acessível
│   ├── vite.config.ts              # Configuração do Vite
│   └── package.json                # Dependências
├── infra/                          # Infraestrutura, containers e dependências
│   ├── Dockerfile                  # Container da aplicação backend
│   ├── Dockerfile.frontend         # Container da aplicação frontend
│   └── requirements.txt            # Dependências Python do backend
├── src/                            # Código-fonte principal do backend (FastAPI)
│   ├── api/
│   │   ├── routes/                 # Endpoints REST (auth, demands, admin)
│   │   ├── app.py                  # Inicialização, lifespan, seed de dados e CORS
│   │   ├── dependencies.py         # Injeção de dependências (JWT, DB, RBAC)
│   │   ├── middlewares.py          # Middlewares de tempo de resposta
│   │   └── schemas.py              # DTOs Pydantic v2 (ConfigDict)
│   ├── services/
│   │   ├── demand_service.py       # Máquina de estados, protocolos e regras
│   │   └── notification_service.py # Disparo assíncrono de notificações de status
│   ├── ai/
│   │   ├── prompts/screening.py    # Prompts de sistema com fidelidade factual
│   │   └── service.py              # Triagem inteligente (Gemini + fallback seguro)
│   ├── db/
│   │   ├── engine.py               # Conexão assíncrona SQLAlchemy
│   │   └── schema.py               # Modelos relacionais (Users, Demands, Departments)
│   ├── config.py                   # Configurações de ambiente (Pydantic Settings)
│   └── main.py                     # Ponto de entrada do servidor Uvicorn
├── tests/                          # Suíte de testes automatizados (Pytest)
│   ├── conftest.py                 # Fixtures assíncronas e cliente HTTP
│   ├── unit/                       # Testes de regras de negócio e triagem de IA
│   └── integration/                # Testes integrados de endpoints e fluxos
├── .env.example                    # Modelo de variáveis de ambiente
├── .gitignore                      # Regras de exclusão do Git
├── docker-compose.yml              # Orquestração local (Backend + Frontend + PostgreSQL)
├── pytest.ini                      # Configuração do Pytest
└── README.md                       # Apresentação do projeto
```

---

## ⚙️ Como Executar

### Pré-requisitos
- [Docker](https://www.docker.com/) e Docker Compose instalados, **ou**
- Python 3.11+ e Node.js 20+

### Opção 1: Via Docker Compose (Recomendado)
```bash
# 1. Clone o repositório
git clone https://github.com/fragaeduardo/GovResolve-MVP.git
cd GovResolve-MVP

# 2. Configure as variáveis de ambiente
cp .env.example .env

# 3. Suba os containers
docker compose up --build
```
- A API estará disponível em `http://localhost:8000` (documentação interativa em `/docs`).
- O Frontend estará acessível em `http://localhost:5173`.

### Opção 2: Execução Local Nativa

#### Backend:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r infra/requirements.txt
cp .env.example .env
uvicorn src.main:app --reload --port 8000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testes Automatizados

O projeto conta com suíte automatizada de testes cobrindo todo o ciclo de vida, integridade de dados e triagem por IA:

```bash
pytest -v
```

**Resultados:**
- `test_full_demand_lifecycle_api`: PASSED (Fluxo completo ponta a ponta na API)
- `test_ai_screening_identifies_self_service`: PASSED (Detecção de autoatendimento)
- `test_ai_screening_identifies_public_service`: PASSED (Classificação de atendimento público)
- `test_ai_screening_factual_fidelity`: PASSED (Preservação estrita dos fatos informados)
- `test_protocol_generation_format`: PASSED (Formato e unicidade do protocolo)
- `test_demand_status_transitions_valid`: PASSED (Fluxo ABERTO → EM ANDAMENTO → FECHADO)
- `test_demand_status_invalid_transition_skip_step`: PASSED (Bloqueio de saltos ilegais)
- `test_demand_status_fechado_requires_resolution_notes`: PASSED (Parecer obrigatório)
- `test_citizen_cannot_update_status`: PASSED (Controle RBAC estrito)

Consulte a [Matriz de Rastreabilidade](docs/matriz-rastreabilidade.md) para o mapeamento completo dos requisitos.
