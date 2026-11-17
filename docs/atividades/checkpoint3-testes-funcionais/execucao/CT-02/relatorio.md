# CT-02 — Relato insuficiente antes da formalização

**Resultado: APROVADO.** Uma execução com relato exato, sem complementação ou aprovação. O chatbot pediu localização como esclarecimento progressivo, mantendo a coleta aberta e sem formalizar. A natureza do problema e o atendimento desejado continuam sem esclarecimento; a aprovação não afirma que a descrição foi coletada ou validada.

## Base e ambiente

- Fontes lidas: `docs/atividades/checkpoint3-testes-funcionais/04_oito_casos_finais.md` (CT-02); RF002/HU002 em `docs/especificacao-requisitos.md`; diagramas `04_multiagentes_tools.md` (loop de dados faltantes) e `03_sequencia.md` (coleta/revisão anterior à confirmação).
- Repositório em `main`, commit `8e058e8`, conforme ambiente preparado. API `127.0.0.1:8000`, portal `127.0.0.1:5173`, SQLite e sessões isolados no diretório local desta execução. O teste não leu nem modificou `.env`.
- Execução: 2026-11-17T06:19:51.346448+00:00 até 2026-11-17T06:19:56.397352+00:00 (UTC; 03:19:51–03:19:56 em São Paulo).
- Sessão CT-02: `[ID de sessão omitido]`. O registro preexistente do CT-01 foi excluído da contagem por sessão.

## Esperado e observado

**Esperado:** O fluxo solicita esclarecimentos para coletar a descrição da situação/atendimento e não conclui o registro nem fornece protocolo com o relato insuficiente (RF002/HU002), sem exigir frase, campo único ou ordem de coleta não especificados.

**Observado:** O chatbot pediu o endereço/ponto de referência como esclarecimento progressivo e permaneceu COLLECTING. A natureza do problema e o atendimento desejado ainda não foram coletados. Não houve proposta, confirmação, demanda da sessão ou protocolo. Uma mensagem, HTTP 200, duas chamadas reais de IA HTTP 200, zero novos registros no banco isolado.

Resposta exibida:

> Qual é o endereço do problema, com rua, número e bairro? Se não souber o número, informe um ponto de referência.

Essa pergunta detalha a localização da situação relatada. Não se presume um endereço obrigatório por requisito, nem que a natureza do problema já esteja esclarecida. A especificação não fixa qual pergunta deve vir primeiro; portanto, pedir localização antes da natureza da ocorrência não fundamenta reprovação deste recorte.

## Passos executados

| Passo | Ação | Resultado observado | Evidência |
|---|---|---|---|
| 1 | Login demonstrativo como cidadão, nova conversa em contexto isolado | Nenhuma sessão anterior no contexto; snapshot prévio com 108 demandas | [Tela inicial](01-inicio.png), [banco antes](database-summary.json), [sessão antes](evidence.json) |
| 2 | Enviar somente `Quero reclamar de um problema na rua` | HTTP 200; pergunta de endereço/ponto de referência; 3,077 s | [Resposta](evidence.json), [resumo HTTP sem tokens ou corpos de relato](http-summary.json), [eventos](events.json) |
| 3 | Observar sem responder ou confirmar | `COLLECTING`, `ready_to_register=false`, proposta nula; sem confirmação/registro na UI | [Captura final](02-apos-relato.png), [texto da UI](02-apos-relato-ui.txt), [sessão](evidence.json) |
| 4 | Comparar banco/sessão e encerrar navegador | Nenhuma demanda da sessão; 108→108 demandas, 133→133 históricos; browser fechado | [Banco depois](database-summary.json), [execução](result.json) |

## Verificações

| Verificação | Resultado | Observado |
|---|---|---|
| Entrada exata em nova sessão, sem complementação/aprovação | Aprovada | Uma mensagem do cidadão; sessão [ID de sessão omitido], inexistente no banco prévio; nenhuma confirmação enviada |
| Pedido de esclarecimento progressivo sobre a situação | Aprovada | Qual é o endereço do problema, com rua, número e bairro? Se não souber o número, informe um ponto de referência. A pergunta detalha a localização da situação. A natureza do problema/atendimento ainda não foi esclarecida, nem se afirma que foi coletada. |
| Coleta permanece aberta sem proposta pronta | Aprovada | COLLECTING; ready_to_register=false; proposal=null; current_proposal=null; problem_type=null |
| Ausência de formalização/protocolo da sessão | Aprovada | Nenhuma demanda vinculada à sessão antes/depois; protocolos da sessão nulos; sem tela de registro ou botão de confirmação. As menções institucionais a protocolo na UI não são números emitidos. |
| Banco isolado sem novos registros/históricos neste caso | Aprovada | Demandas 108 → 108; históricos 133 → 133. Único registro de chat preexistente pertence ao CT-01 e não à sessão CT-02. |
| Uso real do provedor de IA, sem mocks | Aprovada | 2 POST reais de chat/completions HTTP 200 OK no recorte do backend; nenhum erro ou fallback identificado no recorte. |

## Métricas

| Medida | Valor |
|---|---|
| Mensagens do cidadão | 1 |
| Complementações / confirmações | 0 / 0 |
| Tempo observado do chat | 3,077 s |
| Chamadas reais da IA HTTP 200 | 2 |
| Novas demandas / históricos | 0 / 0 |
| Demandas vinculadas à sessão CT-02 | 0 |
| Verificações aprovadas | 6/6 |

As duas chamadas reais ao provedor constam em [ai-evidence.json](evidence.json) e [backend-excerpt.log](evidence.json), às 03:19:54,650 e 03:19:56,153 (São Paulo). Nenhum fallback ou erro apareceu no recorte. Não foram usados mocks.

## Problemas e limitações

Nenhuma falha de produto demonstrada no recorte do CT-02. O pedido de esclarecimento cobriu somente localização neste turno; a descrição ainda não foi coletada/validada.

- Uma execução e somente o primeiro turno, conforme CT-02. O cidadão não informou localização, natureza do problema ou atendimento pretendido após a pergunta; não se avalia o que o fluxo faria em turnos futuros.
- O pedido observado esclarece a localização. Não perguntou qual era a ocorrência nem qual atendimento desejado naquele turno. A aprovação cobre esclarecimento progressivo e ausência de formalização; não declara a descrição já coletada ou validada. RF002/CT-02 não fixam ordem de coleta, campo universal ou frase obrigatória.
- O banco contém seed fictício e o registro do CT-01 anterior. A análise filtra a sessão CT-02 e compara os snapshots; não considera o protocolo do CT-01 como saída deste caso.
- Duração de chat é observacional; CT-02 não mede tempo de confirmação, gov.br oficial, encaminhamento ao órgão ou desempenho futuro.
- O executor concluiu com browser/contexto/Playwright fechados e sem exceção. Não houve repetição do caso, complemento, confirmação ou alteração de código/configuração.

Dados completos e critérios em [result.json](result.json); nenhuma alteração na aplicação, commit ou push.
