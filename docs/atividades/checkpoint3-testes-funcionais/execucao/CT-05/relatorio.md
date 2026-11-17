# CT-05 — Preservação dos fatos na proposta

**Resultado: APROVADO.** A proposta preservou o bueiro danificado, a ausência declarada de feridos e o pedido de vistoria/reparo. Nenhuma vítima, causa, data ou outro fato não informado foi acrescentado. A proposta permaneceu sem aprovação, registro ou protocolo.

Execução: 2026-11-17T06:39:59.041942+00:00 até 2026-11-17T06:41:35.997435+00:00 (UTC; 03:39:59–03:41:35 em Brasília). Ambiente local: UI `127.0.0.1:5173`, backend `127.0.0.1:8000`, SQLite de testes isolado. Sessão `[ID de sessão omitido]`. Main `8e058e8` informada pelo executor principal. Não houve alteração do código, `.env`, configuração, commit ou push.

## Critério e fontes

Caso CT-05 em `docs/atividades/checkpoint3-testes-funcionais/04_oito_casos_finais.md`; RF009/RNF007 e HU007 em `docs/especificacao-requisitos.md`; diagrama `docs/apresentacao/diagramas/03_sequencia.md` e tela `docs/apresentacao/telas/03_revisao.png`. O critério é preservar fatos e sentido sem acrescentar conclusões não fundamentadas; não exige cópia literal.

## Passos, esperado e observado

| Etapa | Entrada/ação executada | Esperado | Observado |
|---|---|---|---|
| 1 | Relato exato: “O bueiro está danificado. Ninguém ficou ferido. Preciso de vistoria e reparo.” | Coletar dados ou preparar proposta fiel | Perguntou endereço com rua/avenida, número, bairro ou referência |
| 2 | “Rua 10, Setor Central, Goiânia.” | Incorporar local fictício e pedir somente faltantes | Perguntou número do imóvel ou referência próxima |
| 3 | “Não tenho um ponto de referência adicional.” | Continuar coleta se necessário | Perguntou número do imóvel mais próximo |
| 4 | Retomada da mesma sessão; “O bueiro fica em frente ao número 100 da Rua 10, Setor Central, Goiânia.” | Preparar proposta para revisão | Proposta v1, `AWAITING_CONFIRMATION`, SEINFRA |
| 5 | Ler proposta, comparar entradas/slots e não clicar Confirmar | Preservar problema, ausência de feridos, pedido e local; não inventar fatos | Todos preservados, sem fatos extras |
| 6 | Conferir UI, HTTP, memória e SQLite isolado; fechar browser/contexto/Playwright | Nenhum registro/protocolo antes de aprovação | Sem POST confirm, zero demanda da sessão, protocolos nulos e banco inalterado |

As perguntas literais e os complementos completos estão em [observation.json](evidence.json), [events.json](events.json) e [final-session.json](evidence.json). O número100 é fictício e foi fornecido pelo testador após a pergunta explícita; não foi criado pelo sistema.

## Comparação semântica

| Fato/atributo | Fonte de entrada | Proposta observada | Avaliação |
|---|---|---|---|
| Problema | O bueiro está danificado | Mesmo conteúdo em descrição e `slots.relato` | Preservado |
| Feridos | Ninguém ficou ferido | “Ninguém ficou ferido.” | Preservado; nenhuma vítima acrescentada |
| Solicitação | Preciso de vistoria e reparo | “Preciso de vistoria e reparo.” | Preservada |
| Rua/bairro/cidade | Primeiro complemento | Rua10, SetorCentral; Goiânia aparece na descrição/relato | Preservados |
| Referência | Terceiro complemento, número100 fictício | `referencia`: “em frente ao número 100 da Rua 10” | Origem explícita no complemento |
| Causas, datas, acidentes, risco ocorrido | Não informados | Nenhum acrescentado na proposta | Conforme RNF007 |

**Descrição factual exibida:**

> Local informado: Rua 10, Setor Central. Referencia informada: em frente ao número 100 da Rua 10. Relato original do cidadao: O bueiro está danificado. Ninguém ficou ferido. Preciso de vistoria e reparo. | Rua 10, Setor Central, Goiânia. | Não tenho um ponto de referência adicional. | O bueiro fica em frente ao número 100 da Rua 10, Setor Central, Goiânia..

**Slots da proposta:** `logradouro = Rua 10`; `bairro = Setor Central`; `referencia = em frente ao número 100 da Rua 10`; `relato` contém exatamente a sequência das quatro mensagens do cidadão, com separadores `|`. Título: “Infraestrutura e Iluminação Pública: Rua 10, Setor Central”; categoria: “Infraestrutura e Iluminação Pública”; órgão sugerido: SEINFRA. Estes campos de organização não introduzem outra ocorrência factual.

A descrição conserva a fala anterior sobre não possuir referência adicional e o número informado depois, como histórico. Os separadores e a pontuação duplicada não alteraram os fatos. A avaliação examinou o sentido da sequência, sem exigir reprodução literal, embora o relato tenha sido majoritariamente reproduzido.

## Ausência de formalização e evidências

`state = AWAITING_CONFIRMATION`; `approved_proposal_version = null`; `formalized_protocol = null`; `registered_protocol = null`. O botão **Confirmar e gerar protocolo** estava visível e não foi acionado. Não houve requisição de confirmação nem mensagem “Demanda registrada!”. Consulta de leitura ao SQLite retornou zero demandas para esta sessão. Contagens antes/depois:109/109 demandas e134/134 históricos. Campos internos `approved_title` e `approved_description` preenchidos não foram confundidos com aprovação.

- [Captura da proposta, inspecionada](04-proposta-final.png), [texto da UI](04-proposta-final-ui.txt), [proposta HTTP](evidence.json) e [proposal.json](evidence.json).
- [Estado final da sessão](evidence.json), [requisições HTTP com credenciais redigidas](http-summary.json), [consulta da sessão no banco](database-summary.json), [banco antes](database-summary.json) e [depois](database-summary.json).
- [IA real: oito HTTP200](evidence.json), [recorte do backend](evidence.json), [execução e encerramento](result.json).

## Métricas

| Métrica | Valor |
|---|---:|
| Turnos de chat | 4 |
| Complementos solicitados respondidos | 3 |
| Tempo acumulado dos POSTs de chat | 11.45s |
| Respostas HTTP200 do chat | 4/4 |
| Chamadas reais de IA HTTP200 | 8 |
| Propostas | 1, versão1 |
| Aprovações / novas demandas / protocolos da sessão | 0 / 0 / 0 |
| Verificações aprovadas | 7/7 |

Os tempos de chat excluem a pausa/retomada do auxiliar. Não houve execução simultânea com outros casos.

## Problemas e limitações

Nenhum defeito funcional foi observado nos critérios do CT-05 nesta amostra. Houve um incidente de procedimento do executor (`CT05-RUNNER01`): pausa após o pedido de número por interpretação excessivamente restrita dos complementos permitidos. A mesma sessão foi retomada para fornecer número100 fictício, sem novo relato, nova sessão, repetição de caso, confirmação ou exceção. [Registro inicial](evidence.json), [retomada](03-sessao-retomada.png) e [eventos](events.json) documentam o procedimento completo.

- Uma amostra real com uma sessão, uma proposta v1 e quatro turnos de chat. Não mede confiabilidade geral do modelo nem garante outros relatos.
- O número100 é dado fictício fornecido pelo testador em resposta à pergunta, não inferência ou invenção do sistema. A frase anterior sobre não possuir referência adicional permanece na transcrição histórica da proposta; o complemento posterior fornece o número. Isso foi considerado no julgamento semântico.
- A descrição é majoritariamente concatenação das falas, com separadores | e pontuação final duplicada; preserva fatos nesta amostra. O caso exige fidelidade semântica, não cópia literal nem um estilo específico de síntese.
- HU007 foi usada como referência de fidelidade do conteúdo produzido; não foi aberta a tela do servidor nem avaliada consulta posterior pelo setor.
- A proposta não foi aprovada nem registrada, conforme escopo. Não houve classificação formal de gravidade nesta sessão; considerações de risco de demandas anteriores no seed/banco não pertencem a este caso.
- Os campos approved_title/approved_description da memória estão preenchidos antes do clique, mas não constituem evidência de aprovação: estado AWAITING_CONFIRMATION, approved_proposal_version nulo, protocolos nulos, nenhum POST confirm e zero demanda comprovam a ausência de formalização.
- A pausa do auxiliar exigiu reabertura do navegador e login do mesmo cidadão de demonstração; a sessão do backend e suas quatro mensagens do cidadão foram preservadas, sem refazer o caso.
- Execução exclusivamente local no banco isolado; nenhuma modificação de aplicação/configuração/.env, nenhum commit/push nem acesso a dados reais.
