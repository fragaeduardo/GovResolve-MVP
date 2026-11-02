# GovResolve — Matriz de Rastreabilidade

**Base:** requisitos e telas da versão local do protótipo, conferidos em 28/10/2026. A `main` do GitHub foi consultada no commit `8794ee39d1bbe4e5abe2162c8ccf2b5feb797149`; foi integrado ao repositório local, preservando as alterações do protótipo, conforme detalhado na [conferência](06_conferencia.md). Os diagramas representam a versão local preparada para apresentação.

| Requisito local | Elementos UML relacionados | Tela ou interação atual |
|---|---|---|
| **RF001 — Autenticação do cidadão** | 01: `Usuário`; 02: autenticação na `API GovResolve`; pré-condição de 03. | `LoginPage`: entrada demonstrativa por perfil. Integração gov.br ainda não implementada. |
| **RF002 — Registro de demanda** | 01: `Usuário`, `Demanda`, `DemandService.create_demand()`; 02: atendimento e serviço de demandas; 03 e 04. | Cidadão → “Nova demanda”: conversa, ficha e confirmação. |
| **RF003 — Geração de protocolo** | 01: `Demanda.protocol`; 03: retorno de `DemandService`; etapa final de 04. | Protocolo exibido depois do registro. |
| **RF004 — Acompanhamento da demanda** | 01: `Demanda`, `Histórico de situação`, `get_demand_by_protocol()`; 02: REST cidadão. | Cidadão → “Meus protocolos”: lista, filtros e detalhe da demanda. |
| **RF005 — Removido do escopo local** | Nenhum componente de notificações nos diagramas locais. | Atualizações consultadas na plataforma. O requisito ainda existe na `main` remota. |
| **RF006 — Identificação da forma de atendimento** | 02: `Atendimento inteligente`; 04: classificação de intenção por `DepartmentRoutingAgent`. | Chat distingue orientação de serviço e reclamação pelo contexto. |
| **RF007 — Orientação para autoatendimento** | 02: atendimento e modelo de linguagem; 04: saída de orientação sem protocolo. | Cartão com instruções e link do catálogo de serviços. |
| **RF008 — Classificação da demanda** | 01: `Órgão`, `Demanda.category`; 02: atendimento; 03 e 04: órgão sugerido com a ficha completa. | Ficha apresenta categoria e órgão sugerido antes de registrar. |
| **RF009 — Organização das informações** | 01: `Demanda.description`; 02: `SessionStore`; 03: revisão repetida da ficha; 04: coleta e correção. | Chat e cartão da ficha. “Não, quero ajustar” retoma a conversa. |
| **RF010 — Encaminhamento ao setor responsável** | 01: relação entre `Órgão` e `Demanda`; 02: serviço de demandas; 04: sugestão e registro do destino. | Protocolo mostra órgão; fila do servidor consulta demandas. O cidadão também pode pedir análise humana; a área de Gestão contém a fila de revisão e a atribuição do órgão. |
| **RF011 — Consulta das demandas pelo servidor** | 01: usuário e vínculos com órgãos; 02: Portal do Servidor, REST equipe e serviço de demandas. | `ServerPanel` / `DemandQueue`: fila, filtros, prioridade e paginação. |
| **RF012 — Atualização do status** | 01: `Demanda.status`, `Histórico de situação`, `DemandService.update_status()`; 02: REST equipe. | Ações da fila: `ABERTO → EM ANDAMENTO → FECHADO`. |
| **RF013 — Controle de acesso** | 01: `Usuário.get_roles()`, `has_role()`, vínculos com órgãos; 02: JWT e perfis na API. | Ambientes de cidadão, servidor e gestão. Sessões privadas, perfis explícitos e escopo por órgão. O login acadêmico não equivale à integração gov.br. |
| **RF014 — Registro da conclusão** | 01: `Demanda.resolution_notes`, histórico e `update_status()`; 02: serviço de demandas. | `DemandCloseModal`: parecer obrigatório ao fechar; cidadão consulta o resultado em “Meus protocolos”. |
| **RF015 — Avaliação do atendimento** | 01: `Avaliação`, vínculo com `Demanda`, `DemandService.add_feedback()`; 02: REST cidadão. | Detalhe de demanda fechada: nota e comentário. |
| **RF016 — Classificação de Gravidade por IA pós-aprovação humana** | 01: `Demanda.severity`; 02: atendimento e modelo; 03 e 04: gravidade antes da tool e depois da confirmação. | Gravidade e justificativa retornam no registro e aparecem nos detalhes e filtros. O catálogo não estabelece SLA oficial. |

## Requisitos não funcionais

| Requisito | Relação com o material | Limite da conferência |
|---|---|---|
| RNF001 — Proteção de dados pessoais | Autenticação, perfis e vínculos de atendimento. | O desenho não certifica segurança ou conformidade LGPD. A integração incluiu verificações de sessão, versão e isolamento de órgãos; não é uma certificação de segurança ou LGPD. |
| RNF002 — Acessibilidade | Imagens opacas, texto escuro, fontes legíveis e informações além de cores. | Acessibilidade completa do aplicativo não foi avaliada nesta revisão. |
| RNF003 — Tempo de confirmação do registro | Resposta final da sequência 03. | Meta de requisito; o caminho mostrado aguarda IA e persistência. Latência inferior a 3 segundos não foi comprovada. |
| RNF004 — Disponibilidade | Infraestrutura da aplicação. | Meta de 99,9%; não comprovada pelos diagramas. |
| RNF005 — Removido do escopo local | Ausência de envio de e-mail nos desenhos locais. | A `main` ainda mantém notificações. |
| RNF006 — Confiabilidade do encaminhamento | Validação do órgão cadastrado e vínculo da demanda. | Fila manual e atribuição pelo gestor foram integradas à versão local. |
| RNF007 — Fidelidade das informações da IA | Coleta factual e revisão pelo cidadão em 03/04. | A conferência do fluxo não mede a qualidade das respostas do modelo. |
