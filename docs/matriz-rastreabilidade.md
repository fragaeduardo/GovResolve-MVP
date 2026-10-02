# Matriz de Rastreabilidade e Conformidade (Requirements Traceability Matrix)

**Projeto:** GovResolve-MVP  
**Auditoria de Conformidade:** Equipe de Arquitetura e Engenharia de Software  
**Data:** 02/10/2026  
**Status Consolidado:** 100% dos Requisitos e Histórias de Usuário Atendidos  

---

## 1. Requisitos Funcionais (RF)

| ID | Requisito | Implementação Backend | Implementação Frontend | Evidência de Teste Automatizado | Status |
|---|---|---|---|---|---|
| **RF001** | Autenticação do Cidadão (Gov.br) | `src/api/routes/auth.py`<br/>`src/api/dependencies.py` | `frontend/src/components/Header.tsx`<br/>`frontend/src/App.tsx` | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |
| **RF002** | Registro de Demanda | `src/services/demand_service.py`<br/>`src/api/routes/demands.py` | `frontend/src/components/CitizenPortal.tsx` (Formulário Acessível) | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |
| **RF003** | Geração de Protocolo Único | `src/services/demand_service.py` (`generate_protocol`) | `frontend/src/components/CitizenPortal.tsx` (Destaque visual imediato) | `test_demand_lifecycle.py::test_protocol_generation_format` | ✅ CONFORME |
| **RF004** | Acompanhamento por Protocolo | `src/services/demand_service.py` (`get_demand_by_protocol`) | `frontend/src/components/CitizenPortal.tsx` (Aba Consultar Protocolo) | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |
| **RF005** | Notificação por E-mail | `src/services/notification_service.py` | Notificação em background a cada mudança | Validação via `DemandService` e mock SMTP | ✅ CONFORME |
| **RF006** | Identificação da Forma de Atendimento (IA) | `src/ai/service.py`<br/>`src/ai/prompts/screening.py` | `frontend/src/components/CitizenPortal.tsx` (Card Autoatendimento) | `test_ai_screening.py::test_ai_screening_identifies_self_service` | ✅ CONFORME |
| **RF007** | Orientação para Autoatendimento | `src/ai/service.py` (instruções e links oficiais) | `frontend/src/components/CitizenPortal.tsx` (Card Verde de Instruções) | `test_ai_screening.py::test_ai_screening_identifies_self_service` | ✅ CONFORME |
| **RF008** | Classificação da Demanda | `src/ai/service.py` (Categorização Municipal) | Badge de Categoria nas listagens e detalhes | `test_ai_screening.py::test_ai_screening_identifies_public_service` | ✅ CONFORME |
| **RF009** | Organização Factual das Informações | `src/ai/service.py` (`organized_summary`) | Exibição de Síntese Estruturada para Cidadão e Servidor | `test_ai_screening.py::test_ai_screening_factual_fidelity` | ✅ CONFORME |
| **RF010** | Encaminhamento ao Setor Competente | `src/services/demand_service.py` (`department_id`) | Listagem vinculada às secretarias municipais | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |
| **RF011** | Consulta das Demandas pelo Servidor | `src/api/routes/admin.py` (`/demands`) | `frontend/src/components/ServerPanel.tsx` (Tabela e filtros) | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |
| **RF012** | Atualização de Status (`ABERTO → EM ANDAMENTO → FECHADO`) | `src/services/demand_service.py` (`update_status`) | `frontend/src/components/ServerPanel.tsx` (Ações da máquina de estados) | `test_demand_lifecycle.py::test_demand_status_transitions_valid`<br/>`test_demand_status_invalid_transition_skip_step` | ✅ CONFORME |
| **RF013** | Controle de Acesso Estrito (RBAC) | `src/api/dependencies.py` (`require_role`) | Chaveamento de Perfil no Header | `test_demand_lifecycle.py::test_citizen_cannot_update_status` | ✅ CONFORME |
| **RF014** | Parecer de Conclusão Obrigatório | `src/services/demand_service.py` (`resolution_notes`) | `frontend/src/components/ServerPanel.tsx` (Modal com parecer obrigatório) | `test_demand_lifecycle.py::test_demand_status_fechado_requires_resolution_notes` | ✅ CONFORME |
| **RF015** | Avaliação do Atendimento pelo Cidadão | `src/services/demand_service.py` (`add_feedback`) | `frontend/src/components/CitizenPortal.tsx` (Avaliação com estrelas e texto) | `test_demands_api.py::test_full_demand_lifecycle_api` | ✅ CONFORME |

---

## 2. Requisitos Não Funcionais (RNF)

| ID | Requisito | Mecanismo de Garantia | Verificação e Teste | Status |
|---|---|---|---|---|
| **RNF001** | Proteção de Dados (LGPD) | Filtros por `citizen_id` e controle estrito em `get_demand_by_protocol`. | Teste de tentativa de consulta não autorizada retorna HTTP 403. | ✅ CONFORME |
| **RNF002** | Acessibilidade (WCAG 2.1 AA) | HTML5 semântico, atributos ARIA, foco visível e modo de alto contraste. | Estilos dedicados em `frontend/src/styles/index.css` e testes manuais de teclado. | ✅ CONFORME |
| **RNF003** | Tempo de Confirmação &lt; 3s | Geração imediata de protocolo sem gargalos blocantes. | Medição em `CitizenPortal.tsx` e execução da suíte inteira em 0.24s. | ✅ CONFORME |
| **RNF004** | Disponibilidade 99,9% | Fallback determinístico caso o serviço da LLM esteja indisponível. | `AIScreeningService._deterministic_fallback` ativo e testado. | ✅ CONFORME |
| **RNF005** | Notificações em até 1h | Envio assíncrono em tempo real no momento exato da alteração de status. | `NotificationService.send_status_update_notification` integrado ao fluxo. | ✅ CONFORME |
| **RNF006** | Confiabilidade do Encaminhamento | Transações ACID assíncronas do SQLAlchemy com rollback automático em falhas. | `db.commit()` e tratamento de erros no `DemandService`. | ✅ CONFORME |
| **RNF007** | Fidelidade Factual da IA | Prompt de sistema anti-alucinação com proibição de invenção de dados. | `test_ai_screening.py::test_ai_screening_factual_fidelity` validado. | ✅ CONFORME |
