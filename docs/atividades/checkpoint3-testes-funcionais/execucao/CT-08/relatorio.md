# CT-08 — Repetir confirmação da mesma proposta

**APROVADO — 5/5 critérios.** As duas confirmações retornaram o protocolo **GR-20261117-DFJ3Z** e a demanda **111**. A repetição não criou cadastro nem histórico adicional.

Execução UTC: 2026-11-17T06:56:52.402377+00:00 a 2026-11-17T06:57:05.382579+00:00. GovResolve local, commit `8e058e8`, cidadão demonstrativo, SQLite e memória isolados. O runner não leu nem alterou `.env`, código ou configuração da aplicação. Sem commits/pushes, mocks, subagentes adicionais ou operações de teste concorrentes. Navegador/contexto encerrados; runner exit 0.

Base consultada: CT-08 de `docs/atividades/checkpoint3-testes-funcionais/04_oito_casos_finais.md`; RF003/HU002 em `docs/especificacao-requisitos.md`; diagramas `03_sequencia.md` (confirmação duplicada por sessão) e `01_classes.md` (unicidade da sessão).

Entrada fictícia: “O bueiro próximo à Rua 10, Setor Central, Goiânia, está danificado e precisa de vistoria e reparo.” Proposta `proposal_30bc6193f546`, versão 1; sessão `[ID de sessão omitido]`.

| Passo | Esperado | Observado e evidência |
|---|---|---|
| Entrar no portal e enviar o relato | Ficha para revisão ainda não registrada | Proposta no primeiro turno, zero complementos; AWAITING_CONFIRMATION e zero demanda da sessão. [Chat](evidence.json), [pré-confirmação](pre-confirmation.png), [sessão](evidence.json). |
| Confirmar pelo botão UI e aguardar integralmente | Registro, protocolo e demanda identificáveis | HTTP 201 em 2,18 s; protocolo acima e demanda 111; uma demanda e um histórico inicial. [Resposta](http-summary.json), [tela](confirmacao.png), [banco intermediário](database-summary.json). |
| Reenviar a mesma confirmação | Mesmo protocolo/demanda; sem segundo cadastro | Mesmo endpoint, contexto/cidadão e JSON capturado com `proposal_id`, `approved_proposal_version=1`, `proposal_version=1`. HTTP 201 em 0,014 s; objeto `demand` idêntico; mensagem “Esta demanda ja foi registrada”. [Requisição original](evidence.json), [repetição](http-summary.json), [eventos](events.json). |
| Conferir banco, sessão e GET por protocolo | Único registro continua associado à sessão e versão | GET HTTP 200/demanda 111; FORMALIZED, versão aprovada 1; nenhum incremento após repetição. [Comparação](http-summary.json), [consulta](http-summary.json), [sessão final](evidence.json). |

| Persistência | Antes | Entre confirmações | Depois da repetição |
|---|---:|---:|---:|
| Demandas totais | 110 | 111 | 111 |
| Históricos totais | 135 | 136 | 136 |
| Demandas desta sessão | 0 | 1 | 1 |
| Históricos desta sessão | 0 | 1 | 1 |

Os snapshots [prévio](database-summary.json), [intermediário](database-summary.json) e [final](database-summary.json) mostram linhas idênticas entre as duas últimas leituras.

Critérios atendidos: mesma sessão/proposta/versão/cidadão; mesmo protocolo; mesma demanda; ausência de segundo cadastro/histórico; sessão conserva protocolo e versão aprovada. Não foi imposto código HTTP específico.

Métricas: **1 turno**, **0 complementos**, chat **3.319 s**, primeira confirmação **2,18 s**, repetição **0,014 s**, **1 demanda nova** na primeira confirmação e **0 na repetição**. **3 chamadas reais de IA HTTP 200**, duas na preparação e uma na primeira formalização; nenhuma nova na repetição. [Evidência de IA](evidence.json), [logs naturais](evidence.json). Tempos são observações, sem SLA.

Problema incidental reproduzido (`CT01-INC01`): a [UI](post-repeat.png) exibe **Aberto (Autuado)**; confirmações/GET retornam **EM ANDAMENTO**, persistido como **EM_ANDAMENTO**. Isso não invalida o critério de idempotência do CT-08. Nenhum erro auxiliar ocorreu.

Limites: uma execução da mesma sessão/versão/cidadão, com confirmações sequenciais; não testa concorrência, versões/cidadãos diferentes nem impede reclamações distintas. O reenvio usou a API no mesmo contexto porque a UI já havia concluído; a tela final continua sendo a produzida pela primeira confirmação. Repetiu-se o objeto JSON original, sem afirmar identidade byte a byte da serialização HTTP. O helper redigiu inclusive um booleano cujo nome continha “token”; nenhum segredo foi registrado. Os critérios e evidências completos estão no [resultado estruturado](result.json).
