<div align="center">

# GovResolve (MVP)

**Plataforma Inteligente de Gestão, Triagem e Encaminhamento de Demandas Públicas**

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
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
├── docs/                     # Documentação técnica, requisitos, MoSCoW e elicitação
│   ├── assets/               # Imagens e identidade visual
│   ├── arquitetura.md        # Especificação técnica e fluxo de dados
│   ├── especificacao-requisitos.md # RFs, RNFs e Histórias de Usuário
│   ├── backlog-moscow.md     # Priorização de backlog e escopo
│   └── elicitacao.md         # Técnicas de elicitação e stakeholders
├── frontend/                 # Aplicação web (React + Vite + Tailwind)
│   ├── public/               # Assets públicos servidos diretamente
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis (WCAG 2.1 AA)
│   │   ├── pages/            # Telas (Cidadão e Servidor)
│   │   ├── services/         # Clientes de comunicação com a API
│   │   ├── hooks/            # Hooks customizados de estado e formulários
│   │   └── styles/           # Estilos globais e tokens de acessibilidade
│   └── package.json          # Dependências do frontend
├── infra/                    # Infraestrutura, containers e dependências
│   ├── Dockerfile            # Container da aplicação backend
│   ├── Dockerfile.frontend   # Container da aplicação frontend
│   └── requirements.txt      # Dependências Python do backend
├── src/                      # Código-fonte principal do backend (FastAPI)
│   ├── api/
│   │   ├── routes/           # Endpoints REST (Auth, Demandas, Admin)
│   │   ├── app.py            # Inicialização e configuração do FastAPI
│   │   ├── dependencies.py   # Injeção de dependências (DB, RBAC)
│   │   ├── middlewares.py    # Middlewares de tempo e cabeçalhos
│   │   └── schemas.py        # Modelos Pydantic (DTOs de entrada e saída)
│   ├── services/             # Casos de uso e regras de negócio da aplicação
│   ├── ai/                   # Integração com LLMs (Gemini) e prompts versionados
│   │   └── prompts/          # Templates e prompts estruturados
│   ├── db/
│   │   ├── migrations/       # Migrações versionadas do banco (Alembic)
│   │   ├── engine.py         # Conexão assíncrona SQLAlchemy
│   │   └── schema.py         # Modelos relacionais (Users, Demands, Departments)
│   ├── config.py             # Configurações de ambiente (Pydantic Settings)
│   └── main.py               # Ponto de entrada da aplicação
├── tests/                    # Testes automatizados (Pytest)
│   ├── conftest.py           # Fixtures compartilhadas e cliente HTTP de teste
│   ├── unit/                 # Testes unitários de regras e schemas
│   └── integration/          # Testes integrados de endpoints e persistência
├── .env.example              # Modelo de variáveis de ambiente
├── .gitignore                # Regras de exclusão do Git
├── docker-compose.yml        # Orquestração local (Backend + Frontend + PostgreSQL)
└── README.md                 # Apresentação do projeto
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
python -m venv .venv
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

## 🧪 Testes

Para executar a suíte de testes com cobertura:
```bash
pytest --cov=src tests/
```
