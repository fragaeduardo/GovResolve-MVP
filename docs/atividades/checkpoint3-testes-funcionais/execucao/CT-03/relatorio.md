# CT-03 — Revisão do relato antes da aprovação

**Resultado: REPROVADO.** A revisão foi executada integralmente pela interface e atualizou título/localização para Rua 12, mas manteve a referência do local anterior como dado corrente da ficha. A ausência de registro sem aprovação foi atendida.

## Base e execução

- Base: `main` `8e058e8`; RF002/RF009/HU002; `04_oito_casos_finais.md`, diagrama `03_sequencia.md` e tela `03_revisao.png`.
- Início/fim (UTC): 2026-11-17T06:28:11.119683+00:00 → 2026-11-17T06:28:18.249001+00:00.
- Sessão: `[ID de sessão omitido]`. Proposta `proposal_0089e4143f56`, v1 → v2.
- Portal local `http://127.0.0.1:5173`; backend local; banco/memória de testes isolados. Dados fictícios. IA real com configuração já existente.
- Um executor, uma sessão, dois turnos. Sem confirmação, commits, pushes, mudanças na aplicação ou leitura/exposição do `.env`.

## Passos e resultados

1. **Entrar como cidadão em contexto Chrome novo; enviar relato fictício pela UI.** Proposta v1 imediatamente, Rua 10/Setor Central, sem complementos solicitados
   - Entrada: “O bueiro próximo à Rua 10, Setor Central, Goiânia, está danificado e precisa de vistoria e reparo.”
   - Evidências: [01-inicio.png](01-inicio.png), [chat-01.json](evidence.json), [02-proposta-inicial.png](02-proposta-inicial.png), [before-db.json](database-summary.json).
2. **Acionar Não, quero ajustar na proposta, sem aprovar.** Mensagem Tudo bem. A ficha ainda não será registrada. O que você quer corrigir ou acrescentar?; entrada de conversa disponível
   - Evidências: [03-ajuste-acionado.png](03-ajuste-acionado.png), [03-ajuste-acionado-ui.txt](03-ajuste-acionado-ui.txt), [events.json](events.json).
3. **Corrigir o local pela entrada da conversa.** Resposta HTTP 200; proposta v2 com Rua 12 no título e logradouro, mas referência corrente próximo à Rua 10
   - Entrada: “Corrija o local para Rua 12, no mesmo Setor Central, Goiânia. Os demais fatos permanecem: o bueiro está danificado e solicito vistoria e reparo.”
   - Evidências: [chat-02.json](evidence.json), [proposal-after.json](proposal-after.json), [04-proposta-revisada.png](04-proposta-revisada.png).
4. **Comparar ficha/estado/banco sem clicar confirmação; encerrar executor.** Demais fatos preservados; ausência de aprovação/protocolo; zero novas demandas/históricos; browser/contexto/Playwright fechados
   - Evidências: [after-revision-session.json](evidence.json), [after-db.json](database-summary.json), [execution.json](result.json).

## Esperado versus observado

| Critério | Esperado | Observado | Resultado |
|---|---|---|---|
| Proposta inicial obtida e ajuste acionado pela UI | Obter proposta sem confirmar e clicar Não, quero ajustar | Proposta v1; clique registrado; portal respondeu Tudo bem. A ficha ainda não será registrada. O que você quer corrigir ou acrescentar? | Atendido |
| Nova versão reflete Rua 12 no logradouro e título | Nova versão da proposta com Rua 12 | Mesma proposta proposal_0089e4143f56, versão 1 → 2; título e campo LOCALIZAÇÃO Rua 10 → Rua 12 | Atendido |
| Consistência da localização na ficha corrigida | A correção para Rua 12 deve estar refletida na ficha sem manter a localização corrigida como referência corrente, preservando o sentido atualizado (RF009) | PONTO DE REFERÊNCIA ainda exibe próximo à Rua 10; a descrição apresenta Local informado: Rua 12, Setor Central. Referencia informada: próximo à Rua 10. A referência é apresentada como dado corrente da ficha, sem indicação de que foi substituída. A descrição também inclui relato original e correção, mas esse histórico não resolve a referência corrente. | Falhou |
| Demais fatos preservados | Manter Setor Central/Goiânia, bueiro danificado e pedido de vistoria/reparo, sem outros fatos inventados | Setor Central permanece; Goiânia, bueiro danificado e vistoria/reparo aparecem no relato da ficha. Sem inserção observada de feridos, datas, causas ou outro problema. Categoria/órgão mantidos. | Atendido |
| Sem aprovação ou formalização da sessão | Não aprovar; nenhuma formalização/protocolo antes de confirmar | AWAITING_CONFIRMATION; approved_proposal_version/formalized_protocol/registered_protocol nulos; nenhum POST de confirmação; sem tela Demanda registrada! | Atendido |
| Nenhuma nova demanda/histórico no banco isolado | Nenhuma demanda vinculada à sessão CT-03 nem novo histórico | Demandas 108 → 108; históricos 133 → 133; nenhuma demanda da sessão CT-03. Registro de chat preexistente pertence ao CT-01. | Atendido |
| IA real e executor concluído sem erro | Usar configuração existente sem mocks, com evidência das chamadas e encerramento do navegador | 3 chamadas reais chat/completions HTTP 200 OK; duas requisições de chat HTTP 200; browser/contexto/Playwright encerrados; sem erro do executor. | Atendido |

## Comparação da ficha

| Campo | Proposta v1 | Proposta v2 |
|---|---|---|
| Localização | Rua 10 | Rua 12 |
| Bairro | Setor Central | Setor Central |
| Ponto de referência corrente | próximo à Rua 10 | próximo à Rua 10 |
| Problema/pedido | Bueiro danificado; vistoria e reparo | Preservados |
| Texto da descrição | Relato inicial | Relato inicial agregado à instrução de correção |

## Problema identificado

**CT03-P01 — Referência corrente não reconciliada após correção do local (impacto médio).** O cidadão solicitou: “Corrija o local para Rua 12, no mesmo Setor Central, Goiânia. Os demais fatos permanecem: o bueiro está danificado e solicito vistoria e reparo.” A ficha v2 passou a apresentar `LOCALIZAÇÃO: Rua 12`, mas manteve `PONTO DE REFERÊNCIA: próximo à Rua 10` e o trecho `Local informado: Rua 12, Setor Central. Referencia informada: próximo à Rua 10.` na descrição factual.

O veredito considera o sentido atualizado exigido por RF009: a rua anterior continua como referência corrente sem esclarecimento de sua validade após a correção. A citação do relato original pode permanecer como histórico; essa citação não é, sozinha, o defeito. Não se presume impossibilidade geográfica entre as duas ruas. A consequência observada é uma ficha ambígua após o pedido de correção, ainda aguardando aprovação. Evidências: [ficha visual](04-proposta-revisada.png), [JSON da ficha](proposal-after.json) e [estado persistido da sessão](evidence.json).

## Métricas

- Critérios: **6/7 atendidos**; 1 falha funcional.
- Turnos de chat: **2**, sendo 1 revisão; soma das durações: **4.488 s**.
- IA real: **3 chamadas HTTP 200 OK**, sem mocks; chat: dois HTTP 200.
- Novas demandas: **0**; demandas da sessão: **0**; históricos: **133 → 133**; protocolos da sessão: **0**.
- Executor concluído sem exceção; navegador, contexto e Playwright encerrados.

## Limitações

- Uma única sessão e uma execução com dois turnos. Não houve repetição buscando resultado favorável, nova correção, confirmação ou teste de persistência da ficha revisada após aprovação.
- O juízo de falha é de consistência semântica da ficha apresentada após a correção explícita do local. Não exige apagamento de histórico ou cópia literal do texto; o campo corrente PONTO DE REFERÊNCIA é a evidência principal.
- A relação geográfica real entre Rua 10 e Rua 12 não foi investigada e não é presumida. Todos os dados são fictícios. O problema identificado é a referência anterior mantida sem reconciliação após o pedido de corrigir o local.
- Banco isolado contém seed fictício e o registro anterior do CT-01. A avaliação filtra a sessão CT-03 e compara contagens; o protocolo do CT-01 não foi emitido por este caso.
- Chamadas de IA são reais e observacionais; os resultados não estimam taxa de erro futura, robustez ou desempenho. Nenhum código/configuração versionada/.env foi alterado.

## Evidências locais

- [Eventos/tempos](events.json), [requisições HTTP redigidas](http-summary.json), [recorte do backend](evidence.json), [chamadas de IA](evidence.json).
- [Banco antes](database-summary.json), [banco depois](database-summary.json), [estado antes de revisar](evidence.json), [estado depois](evidence.json), [encerramento](result.json).
- [Resultado estruturado](result.json).
