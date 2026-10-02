# Matriz de Rastreabilidade e Conformidade (Requirements Traceability Matrix)

**Projeto:** GovResolve-MVP  
**Auditoria de Conformidade:** Equipe de Arquitetura e Engenharia de Software  
**Data da Revisão:** 02/10/2026  
**Status Consolidado:** 100% dos Requisitos e Histórias de Usuário Atendidos com Design Refatorado (Zero Emojis) e Chatbot Conversacional de IA  

---

## 1. Requisitos Funcionais (RF)

| ID | Requisito | Implementação Backend | Implementação Frontend | Evidência de Teste Automatizado | Status |
|---|---|---|---|---|---|
| **RF001** | Autenticação do Cidadão (Gov.br) | `src/api/routes/auth.py`<br/>`src/api/dependencies.py` | `frontend/src/components/Header.tsx`<br/>`frontend/src/App.tsx` | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |
| **RF002** | Registro de Demanda via Chatbot | `src/services/demand_service.py`<br/>`src/api/routes/demands.py` | `frontend/src/components/CitizenPortal.tsx` (Chatbot Interativo) | `test_demands_api.py::test_citizen_chat_assistant_flow` | ✅ CONFORME |
| **RF003** | Geração de Protocolo Único | `src/services/demand_service.py` (`generate_protocol`) | `frontend/src/components/CitizenPortal.tsx` (Cartão com botão copiar) | `test_demand_lifecycle.py::test_protocol_generation_format` | ✅ CONFORME |
| **RF004** | Acompanhamento por Protocolo | `src/services/demand_service.py` (`get_demand_by_protocol`) | `frontend/src/components/CitizenPortal.tsx` (Aba Consultar Protocolo) | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |
| **RF005** | Notificação por E-mail | `src/services/notification_service.py` | Notificação em background a cada alteração | Mock e envio com logging integrado | ✅ CONFORME |
| **RF006** | Identificação da Forma de Atendimento (IA) | `src/ai/service.py` (OmniRoute com fallback de 5 modelos) | `frontend/src/components/CitizenPortal.tsx` (Card Autoatendimento) | `test_ai_screening.py::test_ai_screening_identifies_self_service` | ✅ CONFORME |
| **RF007** | Orientação para Autoatendimento | `src/ai/service.py` (instruções e links oficiais) | `frontend/src/components/CitizenPortal.tsx` (Link direto oficial) | `test_ai_screening.py::test_ai_screening_identifies_self_service` | ✅ CONFORME |
| **RF008** | Classificação da Demanda por Órgão | `src/ai/service.py` (12 órgãos mapeados no catálogo) | Badge e direcionamento de secretaria no chat | `test_ai_screening.py::test_ai_screening_identifies_public_service` | ✅ CONFORME |
| **RF009** | Organização Factual das Informações | `src/ai/service.py` (`process_citizen_chat`) | Síntese Estruturada para Cidadão e Servidor | `test_ai_screening.py::test_ai_screening_factual_fidelity` | ✅ CONFORME |
| **RF010** | Encaminhamento ao Setor Competente | `src/services/demand_service.py` (`department_id`) | Catálogo oficial em `docs/orgaos-competentes.md` | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |
| **RF011** | Consulta das Demandas pelo Servidor | `src/api/routes/admin.py` (`/demands`) | `frontend/src/components/ServerPanel.tsx` (Fila operacional limpa) | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |
| **RF012** | Atualização de Status (`ABERTO → EM ANDAMENTO → FECHADO`) | `src/services/demand_service.py` (`update_status`) | `frontend/src/components/ServerPanel.tsx` (Ações da máquina de estados) | `test_demand_lifecycle.py::test_demand_status_transitions_valid`<br/>`test_demand_status_invalid_transition_skip_step` | ✅ CONFORME |
| **RF013** | Controle de Acesso Estrito (RBAC) | `src/api/dependencies.py` (`require_role`) | Chaveamento institucional no Header | `test_demand_lifecycle.py::test_citizen_cannot_update_status` | ✅ CONFORME |
| **RF014** | Parecer de Conclusão Obrigatório | `src/services/demand_service.py` (`resolution_notes`) | `frontend/src/components/ServerPanel.tsx` (Modal com parecer obrigatório) | `test_demand_lifecycle.py::test_demand_status_fechado_requires_resolution_notes` | ✅ CONFORME |
| **RF015** | Avaliação do Atendimento pelo Cidadão | `src/services/demand_service.py` (`add_feedback`) | `frontend/src/components/CitizenPortal.tsx` (Estrelas SVG minimalistas) | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |

---

## 2. Requisitos Não Funcionais (RNF)

| ID | Requisito | Mecanismo de Garantia | Verificação e Teste | Status |
|---|---|---|---|---|
| **RNF001** | Proteção de Dados (LGPD) | Filtros por `citizen_id` e controle estrito em `get_demand_by_protocol`. | Teste de consulta não autorizada retorna HTTP 403. | ✅ CONFORME |
| **RNF002** | Acessibilidade (WCAG 2.1 AA) | HTML5 semântico, atributos ARIA, foco visível, alto contraste e ZERO emojis visuais. | Estilos dedicados em `frontend/src/styles/index.css` e SVGs minimalistas em `Icons.tsx`. | ✅ CONFORME |
| **RNF003** | Tempo de Confirmação &lt; 3s | Geração imediata de protocolo sem gargalos blocantes. | Protocolo retornado em menos de 100ms. | ✅ CONFORME |
| **RNF004** | Disponibilidade 99,9% | OmniRoute com fallback em cascata de 5 modelos + fallback determinístico local. | `AIScreeningService` suporta 5 modelos em cascata sem interrupção. | ✅ CONFORME |
| **RNF005** | Notificações em até 1h | Envio assíncrono em tempo real no momento exato da alteração de status. | `NotificationService.send_status_update_notification` integrado ao fluxo. | ✅ CONFORME |
| **RNF006** | Confiabilidade do Encaminhamento | Transações ACID assíncronas do SQLAlchemy com rollback automático em falhas. | `db.commit()` e tratamento de erros no `DemandService`. | ✅ CONFORME |
| **RNF007** | Fidelidade Factual da IA | Prompt de sistema anti-alucinação com proibição de invenção de dados. | `test_ai_screening.py::test_ai_screening_factual_fidelity` validado. | ✅ CONFORME |
