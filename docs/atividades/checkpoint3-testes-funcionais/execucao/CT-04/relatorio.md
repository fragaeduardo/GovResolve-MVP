# CT-04 — Classificação e destino conforme catálogo

**Resultado: APROVADO** — 7/7 verificações do escopo passaram. Execução real local em 17/11/2026, de 2026-11-17T06:32:31.035083+00:00 a 2026-11-17T06:37:46.368931+00:00 (UTC; horário local UTC−03).

## Base de avaliação

Fontes locais: `docs/atividades/checkpoint3-testes-funcionais/04_oito_casos_finais.md` (CT-04), `docs/especificacao-requisitos.md` (RF008, RF010, HU008), `docs/orgaos-competentes.md` e `docs/apresentacao/diagramas/03_sequencia.md`. O catálogo associa **bueiros → SEINFRA**. Não foi inventada categoria textual obrigatória, SLA ou status HTTP de aprovação.

Esperado: Reclamação classificada como problema pertinente a bueiros e órgão sugerido/associado SEINFRA conforme catálogo demonstrativo, com confirmação e destino informado no registro (RF008/RF010/HU008), sem afirmar encaminhamento concluído sem evidência da fila do setor.

Observado: Proposta v1 no primeiro turno: Infraestrutura e Iluminação Pública, relato de bueiro e SEINFRA. Confirmação pela UI criou GR-20261117-HPFE8 (id109); GET por protocolo e SQLite isolado comprovam associação SEINFRA. RF010 quanto à fila do setor não foi avaliado.

## Passos executados e evidências

| Passo | Ação e observado | Evidências |
|---|---|---|
| 1 | Entrar na demonstração como cidadão em contexto novo e enviar dado inicial exato. Proposta v1 imediata; 1 turno HTTP200, 3,034s, sem complementos. | [chat-01.json](evidence.json), [chat-01.png](chat-01.png), [after-chat-session.json](evidence.json) |
| 2 | Conferir categoria, relato e sugestão do órgão. Categoria Infraestrutura e Iluminação Pública, relato bueiro quebrado/pedido de reparo e sugestão SEINFRA. | [proposal.json](evidence.json), [chat-01.png](chat-01.png) |
| 3 | Retomar a mesma sessão após incidente do auxiliar e aprovar pelo botão real. Proposta v1 restaurada, clique Confirmar e gerar protocolo, HTTP201 em1,745s, demanda109, protocolo GR-20261117-HPFE8. | [02-proposta-retomada.png](02-proposta-retomada.png), [before-confirm-session.json](evidence.json), [events.json](events.json), [confirmation.json](http-summary.json), [confirmacao.png](confirmacao.png) |
| 4 | Consultar demanda por protocolo e conferir vínculo no SQLite isolado. GET HTTP200; department.id1/nomeSEINFRA; banco department_id1/codeSEINFRA, uma demanda desta sessão. | [demand-get.json](http-summary.json), [destination-db.json](database-summary.json), [after-db.json](database-summary.json) |
| 5 | Verificar capturas e fechar recursos; consolidar evidências. Capturas da proposta e confirmação inspecionadas; contexto/browser/Playwright encerrados;3 chamadas IA reais HTTP200. Limite RF010 mantido. | [execution.json](result.json), [ai-evidence.json](evidence.json), [backend-excerpt.log](evidence.json) |

Entrada fictícia exata: “Bueiro quebrado na Rua 10, Setor Central, Goiânia. Solicito reparo.”

## Esperado versus observado

| Verificação | Esperado | Observado | Resultado |
|---|---|---|---|
| Proposta obtida pelo relato previsto | Enviar dado CT-04 e complementar somente se perguntado até obter proposta | 1 turno, proposta v1 imediata; nenhuma informação adicional solicitada, zero complementos. | APROVADO |
| Classificação pertinente a bueiros | Categoria pertinente ao problema, sem exigir classe textual específica | Infraestrutura e Iluminação Pública; descrição conserva Bueiro quebrado e pedido de reparo. Categoria ampla de infraestrutura é compatível com o relato e com o catálogo demonstrativo. | APROVADO |
| Órgão sugerido conforme catálogo | SEINFRA para bueiros no catálogo do MVP | SEINFRA — Secretaria Municipal de Infraestrutura Urbana; sugestão apresentada na proposta antes da aprovação. | APROVADO |
| Aprovação explícita e protocolo pela UI | Clicar Confirmar e gerar protocolo e observar registro | Um clique real e um POST confirm; HTTP 201; Demanda registrada!, protocolo GR-20261117-HPFE8 e órgão SEINFRA na tela. | APROVADO |
| Destino associado consultável pelo cidadão | Registro da demanda com destino SEINFRA | GET por protocolo HTTP 200; id 109; department.id 1, SEINFRA; classification.category preservada. | APROVADO |
| Persistência isolada com associação ao destino | Uma demanda desta sessão vinculada a SEINFRA no banco de testes | id109, department_id1/codeSEINFRA; 108→109 demandas e 133→134 históricos; somente uma demanda da sessão; protocolos duplicados globais: 0. | APROVADO |
| Execução real e recursos encerrados | IA real, sem mocks nem alteração do produto; encerramento de recursos | 3 chamadas reais chat/completions HTTP 200 OK; um turno de chat e uma confirmação; browser/contexto/Playwright fechados. Incidentes do auxiliar recuperados em registros separados. | APROVADO |

## Registro e métricas

- Sessão: `[ID de sessão omitido]`; proposta `proposal_c26e9d951637` v1.
- Protocolo: `GR-20261117-HPFE8`; demanda `109`.
- Destino: `department_id=1`, `departments.code=SEINFRA`; mesma categoria na proposta, confirmação, GET e banco.
- 1 turno de chat (3,034s), zero complementos; uma confirmação (1,745s). GET por protocolo: 0,008s.
- HTTP observados: chat200, confirmação201, GET correto200. A consulta auxiliar incorreta por id recebeu404 e foi corrigida sem mutação.
- Banco isolado: demandas108→109, históricos133→134, uma demanda da sessão, zero protocolos duplicados.
- IA real:3 chamadas `chat/completions`, todas HTTP200; nenhuma resposta simulada. [ai-evidence.json](evidence.json), [backend-excerpt.log](evidence.json).

## Problemas identificados

**CT04-INC01 — Status inicial exibido diverge do registro (produto (incidental ao critério CT-04))**

Tela de confirmação exibe Aberto (Autuado); resposta de confirmação e GET apresentam EM ANDAMENTO; SQLite registra EM_ANDAMENTO.

Informação de status ao cidadão não coincide com o registro. A classificação e associação ao destino avaliadas pelo CT-04 permanecem comprovadas. Evidências: [confirmacao-ui.txt](confirmacao-ui.txt), [confirmacao.png](confirmacao.png), [confirmation.json](http-summary.json), [demand-get.json](http-summary.json), [destination-db.json](database-summary.json).

**CT04-RUNNER01 — Retomada da mesma sessão e correção de caminho de consulta (incidente do executor, recuperado; não é falha do produto)**

Driver inicial encerrou no EOF de stdin antes da aprovação. Primeiro auxiliar tentou restaurar antes de reload; main.tsx limpa login/sessão em carregamento completo, portanto não encontrou botão e encerrou com AssertionError. Correção externa inseriu o mesmo session_id após reload e antes do login; proposta v1 foi recuperada pelo GET de sessão e confirmada na UI sem reenvio de relato. Auxiliar consultou /demands/109 e recebeu404 porque rota espera protocolo; consulta corrigida /demands/GR-20261117-HPFE8 recebeu200.

Acrescentou tempo e reinicializações do navegador ao procedimento; não criou nova conversa, não repetiu confirmação, não alterou aplicação/configuração/.env e não foi contado como defeito do produto. Evidências: [events.json](events.json), [runner-initial-execution.json](evidence.json), [runner-recovery-failed-execution.json](evidence.json), [runner-error-ui.txt](runner-error-ui.txt), [runner-get-by-id.json](evidence.json), [demand-get.json](http-summary.json), [execution.json](result.json).

## Limitações

- Uma sessão real, uma proposta v1 e uma confirmação. Não houve repetição buscando resultado favorável, mocks, paralelismo ou alteração de código/configuração/.env.
- RF010 exige disponibilidade para consulta pelo setor destinatário para considerar encaminhamento concluído. Este caso comprova sugestão/associação a SEINFRA e consulta pelo cidadão; não abriu nem avaliou fila do servidor e não comprova encaminhamento concluído.
- Catálogo é demonstrativo do projeto acadêmico. A associação local não constitui comunicação ou integração com atendimento oficial.
- Categoria pertinente avaliada por semântica e catálogo; não se exigiu classe textual literal bueiros, SLA ou código HTTP específico para aprovação. Os HTTPs e tempos registrados são observações.
- Interrupções do executor exigiram reabertura de navegador e login do mesmo cidadão de demonstração; retomou-se a mesma sessão do backend, com o mesmo relato e proposta, sem novo chat. Os tempos de chat/confirm não incluem a recuperação; duração total inclui.
- Banco isolado possui seed fictício e demanda anterior CT-01; comparação por sessão e contagens distingue o novo registro CT-04. Não foram acessados dados reais.
- 3 respostas de IA reais HTTP200 demonstram execução desta amostra, sem estimar confiabilidade ou desempenho futuro.

**RF010: não foi comprovado encaminhamento concluído.** A mensagem da aplicação usa “encaminhada”, mas este relatório só comprova sugestão, associação persistida e consulta pelo cidadão; a disponibilidade na fila do órgão permanece fora deste caso.

Execução detalhada e índice de evidências em [result.json](result.json). Browser, contexto e Playwright encerrados; somente artefatos auxiliares e relatórios externos ao repositório foram escritos. Sem commits ou pushes.
