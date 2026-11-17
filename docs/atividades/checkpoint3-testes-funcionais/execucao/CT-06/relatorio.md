# CT-06 — Gravidade somente depois da aprovação

**Resultado: APROVADO.** Sete critérios satisfeitos em uma execução real, sem repetir a sessão para buscar aprovação.

- Execução: 2026-11-17T06:45:41.665934+00:00 a 2026-11-17T06:45:48.525041+00:00 (UTC; horário local 03:45:41–03:45:48 de 17/11/2026).
- Base: main `8e058e8`; frontend `127.0.0.1:5173`, backend `127.0.0.1:8000`, SQLite e memória de sessão isolados.
- Sessão: `[ID de sessão omitido]`; proposta v1; cidadão demonstrativo 2.
- Protocolo: `GR-20261117-N2QOU`; demanda 110; órgão SEINFRA.

## Critério e fontes

RF016/HU014: classificação formal de gravidade somente após aprovação humana, nível CRITICA/ALTA/MEDIA/BAIXA e justificativa técnica, sem predeterminar nível ou SLA; indicar provisório se aplicável.

Fontes lidas: [caso final](../../../../../docs/atividades/checkpoint3-testes-funcionais/04_oito_casos_finais.md), [RF016/HU014](../../../../../docs/especificacao-requisitos.md), [diagrama de sequência](../../../../../docs/apresentacao/diagramas/03_sequencia.md) e [tela 04](../../../../../docs/apresentacao/telas/04_protocolo.png). O caso verifica ordem temporal e contrato; não impõe MEDIA para todo bueiro nem prazo oficial.

## Dados e passos executados

> O bueiro próximo à Rua 10, Setor Central, Goiânia, está danificado e precisa de vistoria e reparo.

Relato fictício; nenhuma gravidade enviada e nenhum complemento solicitado.

| Passo | Ação | Esperado | Observado | Evidências |
|---|---|---|---|---|
| 1 | Abrir contexto novo e entrar no portal como cidadão demonstrativo | Atendimento novo em ambiente de testes. | UI local acessível;109 demandas e 134 históricos pré-existentes no banco isolado. | [01-inicio.png](01-inicio.png), [before-db.json](database-summary.json) |
| 2 | Enviar relato fictício exato do bueiro pela UI | Proposta completa ou pedido de complemento sem gravidade predefinida. | Proposta v1 na primeira resposta; zero complementos; estado AWAITING_CONFIRMATION. | [chat-01.json](evidence.json), [chat-01.png](chat-01.png), [proposal.json](evidence.json) |
| 3 | Inspecionar proposta, sessão, UI, banco e recorte de logs antes de aprovar | Sem gravidade final, aprovação, demanda ou protocolo formal. | Sem gravidade no resumo; versão aprovada/protocolos nulos; zero linha vinculada; sem FormalizationAgent no recorte pré-aprovação. | [pre-approval.png](pre-approval.png), [pre-approval-session.json](evidence.json), [pre-approval-session-demands.json](evidence.json), [pre-approval-backend-excerpt.log](evidence.json) |
| 4 | Clicar Confirmar e gerar protocolo uma única vez | Iniciar avaliação de gravidade após aprovação e registrar resultado. | Clique 06:45:46.682343Z; avaliação 06:45:46.706–48.282Z; HTTP201 às 06:45:48.334757Z; demanda 110 e protocolo GR-20261117-N2QOU. | [events.json](events.json), [http.json](http-summary.json), [temporal-evidence.json](evidence.json), [confirmation.json](http-summary.json) |
| 5 | Conferir tela e consultar demanda por protocolo no mesmo cidadão | Nível válido e parecer técnico correspondentes ao registro persistido. | MEDIA com justificativa contextual na UI, confirmação, GET 200 e SQLite; sessão FORMALIZED e versão aprovada 1. | [post-approval.png](post-approval.png), [get-demand.json](http-summary.json), [post-approval-session-demands.json](evidence.json), [post-approval-session-from-recorded-id.json](evidence.json) |
| 6 | Encerrar navegador e runner, inspecionar evidências e consolidar resultado | Sem concorrência; distinguir problemas do produto e dos auxiliares. | Recursos fechados; exit0; nenhuma exceção no runner; 7/7 critérios satisfeitos; divergência de status registrada separadamente. | [execution.json](result.json), [events.json](events.json), [after-db.json](database-summary.json), [result.json](result.json) |

## Ordem temporal comprovada

| Momento | UTC | Fonte |
|---|---|---|
| Evidência pré-aprovação concluída | 2026-11-17T06:45:46.681601+00:00 | events/execution |
| Clique UI de aprovação | 2026-11-17T06:45:46.682343+00:00 | events |
| Início da classificação formal | 2026-11-17T06:45:46.706000+00:00 | backend |
| Resposta real OpenAI durante classificação | 2026-11-17T06:45:48.280000+00:00 | backend HTTP200 |
| Gravidade/parecer avaliados | 2026-11-17T06:45:48.282000+00:00 | backend |
| Demanda criada | 2026-11-17T06:45:48.288303+00:00 | confirmação/DB |
| Confirmação recebida | 2026-11-17T06:45:48.334757+00:00 | events |

Os logs naturais do backend usam America/Sao_Paulo (UTC−03), normalizado em [temporal-evidence.json](evidence.json). O recorte pré-aprovação não tem formalização; a sessão estava AWAITING_CONFIRMATION e o banco não continha demanda para ela. O clique precede a classificação, que precede a persistência. As duas chamadas IA anteriores serviram ao atendimento; não foram confundidas com classificação formal.

## Resultado e justificativa

**Nível observado: MEDIA.** Parecer devolvido, exibido e persistido:

> O bueiro danificado pode oferecer risco localizado a pedestres e veículos e requer vistoria e reparo. Não há informação sobre gravidade da avaria, obstrução, acidentes ou extensão do impacto, portanto não há base para classificar como risco iminente ou interrupção severa de serviço.

O texto contextualiza risco potencial e registra a incerteza, sem afirmar acidente ocorrido. Não ocorreu fallback provisório: a chamada real recebeu HTTP 200 entre início e conclusão da classificação e retornou parecer contextual. A tela 04 de referência ilustra um fallback possível, sem obrigar esse caminho. Não houve promessa de prazo.

| Verificação | Resultado | Observado |
|---|---|---|
| Proposta completa sem gravidade formal anterior à aprovação | PASSOU | Proposta v1; AWAITING_CONFIRMATION; approved_proposal_version e protocolos nulos; zero linha vinculada à sessão; UI/proposta sem campo de gravidade. |
| Classificação formal ocorre depois do clique de aprovação | PASSOU | Clique 06:45:46.682343Z; classificador iniciado 06:45:46.706Z; IA200 06:45:48.280Z; parecer 06:45:48.282Z; criação 06:45:48.288303Z; resposta 06:45:48.334757Z. Nenhuma formalização no recorte pré-aprovação. |
| Nível pertence ao contrato documentado | PASSOU | MEDIA retornado após aprovação; nenhum nível foi enviado pelo testador. |
| Justificativa técnica contextual e avaliação real de IA | PASSOU | Parecer explica risco localizado potencial, necessidade de vistoria/reparo e incerteza sobre extensão, obstrução e acidentes. Três chamadas reais OpenAI HTTP200, sendo a terceira durante formalização. Sem fallback observado. |
| Gravidade e justificativa persistidas e exibidas no mesmo registro | PASSOU | POST confirmação201; GET /demands/GR-20261117-N2QOU200; demanda 110: MEDIA e o mesmo parecer na resposta, consulta, banco e tela. |
| Aprovação vincula a versão revisada e cria somente uma demanda | PASSOU | FORMALIZED; approved_proposal_version=1; protocolo da sessão=GR-20261117-N2QOU; demandas 109→110; históricos 134→135. |
| Sem prazo inventado no resultado | PASSOU | Leitura integral da confirmação, UI e parecer não encontrou promessa de prazo. A duração medida da requisição é apenas observação, sem critério SLA neste caso. |

## Métricas

| Métrica | Valor |
|---|---|
| Turnos de chat / complementos | 1 / 0 |
| Tempo observado do chat | 3,076 s |
| Tempo observado da confirmação | 1,652 s |
| Novas demandas / históricos | 1 / 1 |
| IA real HTTP200 | 3 (2 atendimento, 1 classificação formal) |
| Critérios satisfeitos | 7/7 |

Contagens de demandas 109→110 e históricos 134→135; usuários 2 e órgãos 12 mantidos. Tempos são medições desta execução, sem teste de SLA.

## Problemas e limitações

**CT06-INC01 (reprodução de CT01-INC01):** UI mostra “Aberto (Autuado)”, mas a confirmação, o GET e o histórico mostram “EM ANDAMENTO”; SQLite usa EM_ANDAMENTO. O problema não altera o cumprimento da regra temporal de gravidade deste caso. Evidências: [tela](post-approval.png), [consulta](http-summary.json), [banco](evidence.json).

Não houve erro de aplicação, HTTP de falha ou exceção do runner neste caso. Uma leitura auxiliar posterior do resumo tentou acessar `.get()` sobre a sessão null após a UI limpar sua chave ativa; isso foi corrigido somente na coleta de evidência, lendo pelo identificador previamente salvo. Não houve nova solicitação nem alteração na aplicação.

- Uma execução real, uma sessão e uma versão de proposta; não mede robustez estatística do modelo nem valida a escolha de nível para todos os relatos.
- Não há limiar numérico documentado para impor um nível específico; MEDIA é o resultado observado, não uma expectativa fixa.
- Ramo de fallback provisório não ocorreu. A tela 04 de referência mostra um exemplo provisório; ela não exige reproduzir indisponibilidade da IA.
- As chamadas HTTP200 são corroboradas por logs naturais da aplicação; não houve mock, monkeypatch ou instrumentação adicional do código.
- Após confirmação, a UI limpa a chave da sessão ativa. A primeira tentativa auxiliar de ler a sessão pelo helper retornou null; a evidência pós-aprovação foi recuperada do arquivo da mesma sessão usando o identificador capturado antes do clique, sem nova interação.
- Limite operacional: no máximo seis complementos solicitados; não utilizado porque a primeira resposta gerou proposta completa.

A execução usou a configuração e as credenciais existentes sem ler ou modificar o `.env` nesta etapa. Não houve modificação do código da aplicação, commit, push ou escrita em dados reais. Browser, contexto Playwright e runner foram encerrados antes da consolidação.

## Evidências principais

[Resultado estruturado](result.json), [execução](result.json), [eventos](events.json), [resumo HTTP sem tokens ou corpos de relato](http-summary.json), [recorte backend](evidence.json), [evidência temporal](evidence.json), [antes](pre-approval.png), [depois](post-approval.png), [sessão antes](evidence.json), [sessão depois](evidence.json), [consulta](http-summary.json).
