# Arquitetura do Sistema GovResolve

## 1. Visão Geral

O **GovResolve** é uma solução para gestão, triagem inteligente e acompanhamento de demandas e reclamações dos cidadãos perante a administração pública. O sistema é estruturado no modelo de **Arquitetura Modular / Clean Architecture**, separando camadas de apresentação, serviços de negócio, persistência e inteligência artificial.

```
+-------------------------------------------------------------------+
|                        Frontend (Vite + React)                    |
|       Portal do Cidadão (Acessível)  |  Painel do Servidor        |
+---------------------------------+---------------------------------+
                                  | REST API / JSON
+---------------------------------v---------------------------------+
|                       Backend (FastAPI)                           |
|  +--------------------+  +--------------------+  +--------------+ |
|  |     API Routes     |  |    Domain Services |  |  AI Module   | |
|  | (Auth, Demands,    |  | (Lifecycle, RBAC,  |  | (Screening,  | |
|  |  Feedback, Admin)  |  |  Protocol, Notify) |  |  Summarizer) | |
|  +--------------------+  +--------------------+  +--------------+ |
|                                 |                                 |
|  +-------------------------------------------------------------+  |
|  |                   Database Layer (SQLAlchemy)               |  |
|  +-------------------------------------------------------------+  |
+---------------------------------+---------------------------------+
                                  |
               +------------------+------------------+
               |                                     |
    +----------v----------+               +----------v----------+
    | PostgreSQL / SQLite |               | Google Gemini API   |
    +---------------------+               +---------------------+
```

---

## 2. Estrutura de Diretórios e Responsabilidades

Conforme o guia de **Arquitetura de Repositórios**:

- **`src/`**: Núcleo da aplicação backend.
  - **`api/`**: Camada de transporte HTTP, rotas, contratos de entrada e saída (Pydantic DTOs), dependências de injeção (RBAC, sessões) e middlewares.
  - **`services/`**: Casos de uso e lógica de negócio central (geração de protocolo único, transições de status da demanda, envio de e-mails assíncronos).
  - **`ai/`**: Integração com modelos generativos (Gemini), prompts versionados e rotinas de extração estruturada sem alucinação.
  - **`db/`**: Modelos de entidades relacionais (SQLAlchemy), conexão e migrations (Alembic).
  - **`config.py`**: Configurações centralizadas tipadas com pydantic-settings.
  - **`main.py`**: Ponto de entrada do executável.

- **`frontend/`**: Aplicação de interface com usuário.
  - **`src/components/`**: Componentes reutilizáveis focados em acessibilidade (WCAG 2.1 AA).
  - **`src/pages/`**: Páginas do Cidadão (Registro, Consulta, Autoatendimento) e Servidor (Gestão de Demandas).
  - **`src/services/`**: Clientes de comunicação com a API backend.
  - **`public/`**: Assets estáticos e identidade visual do GovResolve.

- **`infra/`**: Configurações operacionais e empacotamento.
  - Contém `requirements.txt`, Dockerfiles (`Dockerfile`, `Dockerfile.frontend`) e receitas de inicialização.

- **`tests/`**: Testes automatizados.
  - **`unit/`**: Testes de regras de negócio isoladas (máquina de estados, validações).
  - **`integration/`**: Testes de rotas da API, persistência e autenticação.

- **`docs/`**: Documentação técnica, requisitos, backlog e elicitação do projeto.

---

## 3. Máquina de Estados da Demanda (RF012)

O ciclo de vida da demanda é estritamente controlado pela aplicação, sendo permitidas apenas as transições a seguir por servidores autorizados:

```
[ REGISTRO ]
     |
     v
 +--------+      Servidor assume atendimento      +--------------+      Servidor registra parecer      +---------+
 | ABERTO | ----------------------------------->  | EM ANDAMENTO | --------------------------------->  | FECHADO |
 +--------+                                       +--------------+                                     +---------+
```

- Tentativas de salto de estado inválido (ex: ABERTO direto para FECHADO sem justificativa ou recuo de status) são barradas pelo modelo de domínio.
- A conclusão exige obrigatoriamente o preenchimento de `resolution_notes` (RF014).
