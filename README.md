<div align="center">

# GovResolve (MVP)

**Plataforma Inteligente de Gestão, Triagem e Encaminhamento de Demandas Públicas**

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

> **Projeto acadêmico / demonstração:** não é um serviço oficial da Prefeitura de Goiânia ou do gov.br. O login do cidadão é simulado e não deve ser usado com dados reais.

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
2. **Classificação contextual com IA:**
   - O provedor configurado interpreta a intenção com base na conversa, sem escolher órgão por palavras-chave.
   - A ficha é completada antes de sugerir o órgão. O cidadão pode corrigir e precisa aprovar antes do registro.
   - OpenAI e OmniRoute são opções de configuração. Sem classificação confiável, o sistema pede esclarecimentos ou aceita revisão humana solicitada pelo cidadão.
   - A gravidade é avaliada após a aprovação. Se a IA estiver indisponível, o registro recebe gravidade provisória, identificada para revisão humana.
3. **Catálogo demonstrativo de Órgãos e Concessionárias:**
   - 12 destinos de triagem no [catálogo](docs/orgaos-competentes.md) (SEINFRA, COMURG, SMS, SET, AMMA, SEFAZ, SME, SANEAGO, AGCM, PROCON, SEMASDH e CMTC); iluminação pública é categoria da SEINFRA.
4. **Autoatendimento vs Atendimento Público:**
   - Orientações de autoatendimento (IPTU, certidões); links não verificados foram removidos.
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
│   ├── especificacao-requisitos.md # RF001 a RF016, RNFs e Histórias de Usuário
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
│   │   ├── styles/index.css        # Estilos, tema e alto contraste (sem auditoria WCAG)
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
│   ├── ai/
│   │   ├── service.py              # Integração com os provedores configurados
│   │   └── agents/                # Conversa, ficha, destino, aprovação e formalização
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

## Preparar as variáveis locais (obrigatório)

```bash
cp .env.example .env
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Abra o `.env` e configure `SECRET_KEY` usando uma chave aleatória gerada acima.
Para entrar pelo **modo de demonstração com um clique**, habilite `DEMO_MODE=True`
(com `ENV=development` e `DEBUG=True`). Na tela inicial, escolha **Cidadão**, **Servidor**
(selecione também o órgão), ou **Gestor**. Você pode trocar o perfil voltando à tela inicial.
Configure o provedor de IA em `AI_PROVIDER` e sua credencial no `.env` (`OPENAI_API_KEY`
ou `OMNIROUTE_API_KEY`). Se preferir usar
além do demo o login administrativo legado, defina um
`DEMO_STAFF_ACCESS_CODE` de **ao menos 12 caracteres** para entrar como servidor
demonstrativo (login `52998224725`). Esse código é usado apenas no MVP,
**não é autenticação oficial**. A API bloqueia o login de servidor caso não esteja
configurado. Para executar pelo Docker, preencha `POSTGRES_PASSWORD` e confira
`OMNIROUTE_DOCKER_BASE_URL`.

O arquivo `.env` não é versionado. **Revogue/rotacione a chave OmniRoute
anteriormente exposta no histórico do GitHub** — retirar do código atual não
apaga os commits anteriores.

Mais detalhes em [progresso da implementação](docs/mvp-implementation-progress.md).

---

## Como Executar

### 1. Iniciar Servidor de IA (OmniRoute)
```bash
omniroute serve --daemon
```
O servidor estará rodando em `http://localhost:20128`.

### 2. Backend (FastAPI)
```bash
cd GovResolve-MVP
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

A execução automática do GitHub Actions foi desativada a pedido do mantenedor,
para interromper as notificações repetidas. Execute os testes localmente antes de publicar
ou integrar alterações. Não há garantia
prévia de quantidade de testes passando.

Na integração local de 28/10/2026, passaram **18 testes direcionados**, TypeScript e build
Vite. A suíte legada completa não foi validada; alguns cenários ainda descrevem a
triagem anterior. O dataset `tests/data/triage_baseline_48.jsonl` e o script
`scripts/evaluate_triage.py` são referências históricas de regras e não medem a
classificação contextual atual.

A Ouvidoria tem uma fila separada: quando o cidadão solicita revisão humana do
destino, um gestor poderá atribuir o órgão após a formalização.

## Materiais da apresentação

Os dois PDFs, fontes dos diagramas, capturas e orientações de demonstração estão
listados em [docs/apresentacao/README.md](docs/apresentacao/README.md).
A base local foi atualizada para `main` em `8794ee39`, preservando as melhorias
locais ainda não publicadas. O backup anterior permanece no stash `bb42169`.
