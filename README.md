<div align="center">

# GovResolve (MVP)

**Plataforma Inteligente de Gestão, Triagem e Encaminhamento de Demandas Públicas**

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![Tests Passing](https://img.shields.io/badge/tests-10%20passed-brightgreen.svg)](#-testes-automatizados)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-blue.svg)](#-acessibilidade)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Sobre o Projeto

O **GovResolve** é uma plataforma centralizada desenvolvida para modernizar a gestão de reclamações e solicitações dos cidadãos aos órgãos públicos municipais. Através de um **Chatbot Inteligente de Atendimento ao Cidadão** e integração com modelos de linguagem (OmniRoute com fallback multi-modelo), o sistema realiza a acolhida humanizada, solicita dados complementares (endereço, pontos de referência), orienta serviços de autoatendimento e encaminha demandas complexas diretamente aos setores competentes da administração pública.

### Equipe do Projeto — Grupo 10 (Ctrl+Z)
- **Eduardo Fraga Pereira** — 202405847
- **Ralph dos Reis Torres** — 202406925
- **Samuel Amorim Jaime** — 202205559
- **Wender Viana Faria Santos** — 202401832

*Disciplina: Engenharia de Software — Bacharelado em Ciência da Computação (INF / UFG)*

---

## Principais Inovações e Fluxos

1. **Chatbot Conversacional com Agentes Inteligentes:**
   - Interface conversacional moderna e minimalista (livre de emojis, utilizando tipografia sóbria e ícones vetoriais limpos).
   - Diálogo com o cidadão: acolhimento, identificação da demanda e solicitação de localização faltante.
   - Pílulas de ação rápida com assuntos frequentes para início imediato.
2. **Integração OmniRoute & Cascata de Fallback (5+ Modelos):**
   - Conexão configurada com o servidor OmniRoute (`http://localhost:20128/v1`).
   - Fallback sequencial entre os melhores modelos:
     1. `uq/turboderp/Qwen3.8-27B-exl3`
     2. `google/gemini-2.5-flash`
     3. `openai/gpt-4o-mini`
     4. `anthropic/claude-3-5-sonnet`
     5. `deepseek/deepseek-chat`
     6. *Fallback determinístico local* para garantia de 99,9% de disponibilidade (RNF004).
3. **Catálogo Oficial de Órgãos e Concessionárias:**
   - 12 órgãos municipais catalogados em [`docs/orgaos-competentes.md`](docs/orgaos-competentes.md) e provisionados no banco (SEINFRA, COMURG, SMS, SMM, AMMA, SEFIN, SME, SANEAGO, Iluminação Pública, GCM, PROCON e SEMAS).
4. **Autoatendimento vs Atendimento Público:**
   - Autoatendimento com links governamentais diretos e passo a passo (IPTU, certidões).
   - Atendimento público com geração de protocolo único (`GR-YYYYMMDD-XXXX`), fila operacional para servidores e máquina de estados estrita (`ABERTO → EM ANDAMENTO → FECHADO`).
   - Obrigatoriedade de parecer técnico no encerramento (RF014) e avaliação pelo cidadão (RF015).

---

## Arquitetura do Repositório

```text
GovResolve-MVP/
├── docs/                           # Documentação técnica e de conformidade
│   ├── assets/                     # Identidade visual do GovResolve
│   ├── orgaos-competentes.md       # Catálogo dos 12 órgãos públicos municipais
│   ├── matriz-rastreabilidade.md   # Matriz de conformidade dos requisitos
│   ├── arquitetura.md              # Visão arquitetural, fluxo de dados e RBAC
│   ├── especificacao-requisitos.md # RF001 a RF015, RNFs e Histórias de Usuário
│   ├── backlog-moscow.md           # Priorização MoSCoW e limites do escopo
│   └── elicitacao.md               # Técnicas de elicitação e mapa de stakeholders
├── frontend/                       # Aplicação Web (React + Vite + Tailwind + Icons SVG)
│   ├── public/                     # Assets estáticos
│   ├── src/
│   │   ├── components/
│   │   │   ├── Icons.tsx           # Conjunto de ícones vetoriais minimalistas
│   │   │   ├── Header.tsx          # Cabeçalho institucional com alto contraste
│   │   │   ├── CitizenPortal.tsx   # Chatbot de triagem e consulta por protocolo
│   │   │   └── ServerPanel.tsx     # Fila de atendimento com máquina de estados
│   │   ├── services/api.ts         # Cliente HTTP da API REST e Chatbot
│   │   ├── styles/index.css        # Acessibilidade WCAG 2.1 AA e alto contraste
│   │   ├── App.tsx                 # Composição da aplicação e perfis
│   │   └── main.tsx                # Entrypoint React
│   ├── index.html                  # Template HTML5 limpo
│   └── vite.config.ts              # Configuração do Vite
├── infra/                          # Infraestrutura, containers e dependências
│   ├── Dockerfile                  # Container backend Python
│   ├── Dockerfile.frontend         # Container frontend Vite
│   └── requirements.txt            # Dependências Python do backend
├── src/                            # Código-fonte principal do backend (FastAPI)
│   ├── api/
│   │   ├── routes/                 # Endpoints REST (auth, demands/chat, admin)
│   │   ├── app.py                  # Lifespan, seed dos 12 órgãos e CORS
│   │   ├── dependencies.py         # JWT e controle de acesso RBAC
│   │   └── schemas.py              # DTOs Pydantic v2
│   ├── services/
│   │   ├── demand_service.py       # Máquina de estados e ciclo de vida
│   │   └── notification_service.py # Notificações assíncronas por e-mail
│   ├── ai/
│   │   ├── service.py              # OmniRoute com 5 modelos e agente conversacional
│   │   └── prompts/screening.py    # Prompts de sistema com fidelidade factual
│   ├── db/
│   │   ├── engine.py               # Sessão assíncrona SQLAlchemy
│   │   └── schema.py               # Modelos relacionais
│   ├── config.py                   # Configurações do OmniRoute e aplicação
│   └── main.py                     # Entrypoint Uvicorn
├── tests/                          # Suíte de testes automatizados (Pytest)
│   ├── conftest.py                 # Fixtures e cliente de teste
│   ├── unit/                       # Testes de máquina de estados e IA
│   └── integration/                # Testes de API e fluxo conversacional
├── .env.example                    # Modelo de variáveis de ambiente
├── pytest.ini                      # Configuração do Pytest
└── README.md                       # Apresentação do projeto
```

---

## Como Executar

### 1. Iniciar Servidor de IA (OmniRoute)
```bash
omniroute serve --daemon
```
O servidor estará rodando em `http://localhost:20128`.

### 2. Backend (FastAPI)
```bash
cd "/home/eduardo/Área de trabalho/Engenharia de Software/GovResolve-MVP"
source .venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```
- Documentação interativa Swagger: `http://localhost:8000/docs`

### 3. Frontend (React + Vite)
```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```
- Interface Web acessível: `http://localhost:5173`

---

## Testes Automatizados

Para rodar a suíte completa de testes:
```bash
pytest -v
```

**Resultado: 10 passed em 10 testes**
- `test_full_demand_lifecycle_api`: PASSED
- `test_citizen_chat_assistant_flow`: PASSED (Fluxo conversacional do chatbot)
- `test_ai_screening_identifies_self_service`: PASSED
- `test_ai_screening_identifies_public_service`: PASSED
- `test_ai_screening_factual_fidelity`: PASSED
- `test_protocol_generation_format`: PASSED
- `test_demand_status_transitions_valid`: PASSED
- `test_demand_status_invalid_transition_skip_step`: PASSED
- `test_demand_status_fechado_requires_resolution_notes`: PASSED
- `test_citizen_cannot_update_status`: PASSED
