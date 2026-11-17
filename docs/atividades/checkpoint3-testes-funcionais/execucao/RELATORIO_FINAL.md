# GovResolve — relatório de execução real dos oito casos funcionais

**Data:** 17/11/2026. **Repositório:** fragaeduardo/GovResolve-MVP. **Branch:** `main`. **Commit avaliado:** `8e058e8e8bf883fbf19b92db8d8e350fa5042d92`. **Execução:** local. Este relatório, os resultados estruturados sanitizados e as evidências selecionadas estão publicados nesta pasta.

Foram executados os oito casos de `docs/atividades/checkpoint3-testes-funcionais/04_oito_casos_finais.md`, com um subagente especialista por caso, estritamente em sequência. **Sete foram aprovados e um reprovado (CT-03)**. Não houve caso bloqueado. A aprovação se restringe aos dados e ao comportamento observados nesta campanha.

Os documentos versionados do checkpoint continuam descrevendo o projeto de casos “sem execução”. A execução posterior está registrada separadamente, sem modificar os artefatos acadêmicos ou os requisitos.

## Resultado por caso

| Caso | Resultado | Observação principal | Relatório individual |
|---|---|---|---|
| CT-01 | **APROVADO** | Protocolo exibido após confirmação, vinculado à demanda 108 e único no banco observado. | [Detalhes](CT-01/relatorio.md) |
| CT-02 | **APROVADO** | Pediu localização; manteve coleta aberta sem proposta, demanda ou protocolo. Natureza do problema ainda não coletada. | [Detalhes](CT-02/relatorio.md) |
| CT-03 | **REPROVADO** | Localização e título mudaram para Rua 12, mas a referência corrente permaneceu “próximo à Rua 10”. | [Detalhes](CT-03/relatorio.md) |
| CT-04 | **APROVADO** | Categoria de infraestrutura pertinente ao relato; SEINFRA sugerida e associada à demanda 109. Fila do setor não avaliada. | [Detalhes](CT-04/relatorio.md) |
| CT-05 | **APROVADO** | Preservou bueiro danificado, ausência de feridos e vistoria/reparo, com os complementos fictícios solicitados. | [Detalhes](CT-05/relatorio.md) |
| CT-06 | **APROVADO** | Gravidade MEDIA e justificativa após aprovação; antes dela não havia classificação formal ou demanda da sessão. | [Detalhes](CT-06/relatorio.md) |
| CT-07 | **APROVADO** | Botão X cancelou a proposta sem gerar demanda ou protocolo. | [Detalhes](CT-07/relatorio.md) |
| CT-08 | **APROVADO** | Mesma sessão/versão/cidadão: repetição retornou o mesmo protocolo e demanda 111; nenhum segundo cadastro. | [Detalhes](CT-08/relatorio.md) |

## Ambiente, sincronização e proteção das credenciais

O checkout foi sincronizado por `git fetch --prune origin +refs/heads/main:refs/remotes/origin/main`, `git reset --hard origin/main` e `git clean -ffdx -e /.env`. Foram descartadas 405 entradas indicadas pela limpeza, incluindo ambientes, relatórios, auxiliares, memórias e bancos SQLite locais anteriores. Conforme a instrução de preservar somente o `.env`, não foram mantidos backups dessas divergências. O isolamento de dados descrito a seguir se refere à execução dos testes após essa sincronização.

O `.env` original permaneceu no lugar: conteúdo, tamanho, inode, modo e data de modificação conferidos antes/depois, sem alterações. Não é rastreado pelo Git. O valor de nenhuma chave ou credencial consta neste relatório. A comparação do conteúdo foi feita por hash armazenado apenas em metadado privado local; o hash não é publicado aqui. Ao final da campanha, `HEAD` correspondia à `main` remota no commit avaliado e a árvore de trabalho estava limpa. A campanha não fez commits nem pushes; esta publicação posterior contém documentação e evidências selecionadas. [Resumo de integridade](integrity-summary.json).

A aplicação leu sua configuração e chave existentes: provedor OpenAI, modelo `[valor local omitido]`. Houve chamadas reais, sem mocks, alteração de respostas ou substituição dos agentes da aplicação. As credenciais permaneceram apenas no fluxo de autenticação necessário. Os logs naturais evidenciam **27 respostas HTTP 200** de chamadas ao provedor; não foi observado fallback nesta campanha. Não foram medidos tokens, cobrança ou custo.

O backend original rodou em `http://127.0.0.1:8000`, com um worker; o frontend original em `http://127.0.0.1:5173`. Apenas `DATABASE_URL` e `AGENT_MEMORY_DIR` foram sobrescritos no processo do backend, apontando a `isolated.sqlite3` e `agent_memory/` desta pasta. O `.env` não foi editado. O banco configurado originalmente não foi usado pelos testes. A inicialização normal do MVP criou 107 demandas fictícias de seed, 132 históricos e 12 órgãos. A campanha adicionou quatro demandas e quatro históricos; as avaliações filtram a sessão de cada caso para distinguir seed e registros anteriores. [Base inicial](database-summary.json) e [base final](database-summary.json).

As interações foram feitas no Chrome por Playwright, em contextos novos com o perfil fictício do cidadão. Cada caso teve sua própria sessão de chat. A leitura do SQLite e da memória JSON isolados serviu como evidência complementar; o comportamento foi exercitado pelos controles reais da interface. A repetição do CT-08 foi enviada pela API autenticada após a primeira confirmação, conforme previsto no caso. Não foram abertos portais ou bancos de produção. As chamadas reais à IA receberam somente os relatos e complementos fictícios do atendimento.

Os auxiliares e a instalação Python ficaram fora do repositório. Dependências do frontend foram reinstaladas via `npm ci --no-audit --no-fund --ignore-scripts`, sem mudança do lockfile. Python 3.12.3; Chrome 151.0.7922.169; Playwright 1.65.2. [Versões do ambiente](environment-summary.json) e [dependências Python resolvidas](dependencies-summary.json).

Os navegadores e executores de cada caso foram encerrados antes do caso seguinte. Ao fim da campanha, backend e frontend iniciados para os testes também foram encerrados; o banco SQLite e os logs brutos permanecem locais, enquanto as capturas e resumos selecionados estão nesta pasta. [Encerramento](execution-closure.json).

## Sequência e métricas observadas

Cada subagente foi criado somente após o anterior concluir suas interações, fechar recursos, salvar relatório/resultado e encerrar o turno. Não houve execução paralela de casos, subagentes ou confirmações. A tabela registra os intervalos de coleta declarados nos `result.json`; redação posterior e espera entre especialistas não compõem uniformemente esses intervalos e não devem ser tratadas como latência da aplicação. Horário de Brasília (UTC−03:00).

| Ordem | Subagente | Início da coleta | Fim da coleta | Turnos de chat | IA HTTP 200 | Novas demandas |
|---|---|---|---|---:|---:|---:|
| 1 / CT-01 | `ct01_registro_protocolo` | 03:14:57 | 03:16:08 | 1 | 3 | 1 |
| 2 / CT-02 | `ct02_relato_insuficiente` | 03:19:51 | 03:19:56 | 1 | 2 | 0 |
| 3 / CT-03 | `ct03_revisao_relato` | 03:28:11 | 03:28:18 | 2 | 3 | 0 |
| 4 / CT-04 | `ct04_classificacao_destino` | 03:32:31 | 03:37:46 | 1 | 3 | 1 |
| 5 / CT-05 | `ct05_fidelidade_fatos` | 03:39:59 | 03:41:35 | 4 | 8 | 0 |
| 6 / CT-06 | `ct06_gravidade_pos_aprovacao` | 03:45:41 | 03:45:48 | 1 | 3 | 1 |
| 7 / CT-07 | `ct07_cancelamento` | 03:51:51 | 03:51:56 | 1 | 2 | 0 |
| 8 / CT-08 | `ct08_confirmacao_idempotente` | 03:56:52 | 03:57:05 | 1 | 3 | 1 |

| Métrica | Valor desta campanha |
|---|---:|
| Casos executados / previstos | 8 / 8 |
| Aprovados / reprovados / bloqueados | 7 / 1 / 0 |
| Aprovação dos casos observados | 87,5% |
| Verificações detalhadas atendidas / registradas | 49 / 50 |
| Sessões de atendimento | 8 |
| Turnos de chat enviados pelo cidadão | 12 |
| Chamadas reais de IA com resposta HTTP 200 | 27 |
| Confirmações iniciais / repetidas | 4 / 1 |
| Demandas antes → depois | 107 → 111 |
| Históricos antes → depois | 132 → 136 |
| Protocolos duplicados encontrados no banco final | 0 |
| Novos cadastros na repetição do CT-08 | 0 |

As 50 verificações são decomposições registradas pelos especialistas, incluindo evidências auxiliares de execução, e não 50 casos independentes nem cobertura percentual dos RFs. O percentual de 87,5% usa somente os oito casos como denominador; não é acurácia da IA, disponibilidade ou probabilidade de sucesso futuro.

| Caso | Tempo HTTP da confirmação inicial | Protocolo / demanda |
|---|---:|---|
| CT-01 | 2,364 s | `GR-20261117-R0IMB` / 108 |
| CT-04 | 1,745 s | `GR-20261117-HPFE8` / 109 |
| CT-06 | 1,652 s | `GR-20261117-N2QOU` / 110 |
| CT-08 | 2,180 s | `GR-20261117-DFJ3Z` / 111 |

Média das quatro confirmações iniciais: **1,985 s**; mediana 1,963 s; faixa 1,652–2,364 s. Repetição do CT-08: **0,014 s**. São medições observacionais do pedido/resposta HTTP, sem teste de carga, série estatística ou veredito sobre RNF003. Não foi avaliado um SLA de confirmação visual nem a independência do processamento de IA.

## Problemas encontrados

### P-01 — Correção de localização mantém referência corrente anterior (CT-03)

**Resultado:** reprovado no CT-03, por consistência semântica de RF009. A proposta v1 trazia Rua 10 e a referência “próximo à Rua 10”. O cidadão acionou **Não, quero ajustar** e enviou: “Corrija o local para Rua 12, no mesmo Setor Central, Goiânia. Os demais fatos permanecem: o bueiro está danificado e solicito vistoria e reparo.”

A v2 alterou título e `slots.logradouro` para Rua 12, mas manteve no campo corrente **PONTO DE REFERÊNCIA** “próximo à Rua 10”, repetido como “Referencia informada” na descrição. O veredito considera a reconciliação incompleta do local corrigido; não exige apagar o histórico da conversa ou a citação identificada como relato original. A relação geográfica entre as ruas não foi investigada nem é presumida impossível. A ficha preservou os demais fatos e permaneceu sem aprovação/protocolo, critérios atendidos.

**Reprodução:** obter a proposta inicial → clicar ajuste → enviar a correção acima → ler localização e ponto de referência da v2, sem aprovar. **Impacto observado:** ambiguidade na ficha apresentada ao cidadão; não foi testado seu registro posterior.

Evidências: [proposta anterior](CT-03/proposal-before.json), [proposta revisada](CT-03/proposal-after.json), [captura da ficha v2](CT-03/04-proposta-revisada.png) e [relatório CT-03](CT-03/relatorio.md).

### P-02 — Status da confirmação na tela diverge da API e do banco

**Ocorrências:** CT-01, CT-04, CT-06 e CT-08; consolidação dos registros incidentais CT01-INC01/CT04-INC01/CT06-INC01/CT08-INC01. A tela de sucesso mostra **Aberto (Autuado)**, enquanto resposta de confirmação, GET por protocolo, histórico e SQLite indicam **EM ANDAMENTO** (`EM_ANDAMENTO` no banco).

**Reprodução:** confirmar proposta → comparar cartão de sucesso com a resposta/consulta da mesma demanda. **Impacto observado:** informação de estado inconsistente entre as superfícies consultadas pelo cidadão. O problema é reportado sem alterar os critérios de protocolo, destino, gravidade ou idempotência dos casos correspondentes. Não foi escolhido um novo requisito de status inicial nem aplicada correção.

Evidências: [tela CT-01](CT-01/pos-confirmacao.png), [texto da tela](CT-01/pos-confirmacao-ui.txt), [resumo HTTP CT-01](CT-01/http-summary.json), [banco CT-01](CT-01/database-summary.json); confirmações adicionais em [CT-06](CT-06/http-summary.json) e [CT-08](CT-08/http-summary.json).

### Incidentes dos auxiliares, separados dos defeitos do produto

- Preparação: o primeiro comando encontrou um caminho de trabalho com normalização Unicode inválida; usou-se o caminho absoluto existente. O snapshot inicial do auxiliar referenciou `user_id`; foi corrigido para `citizen_id` antes do CT-01. Esses erros não foram classificados como falhas da aplicação.
- CT-01: fechamento de driver antes do relato e uma consulta por ID em rota que usa protocolo; a consulta correta funcionou. Nenhum relato foi repetido buscando aprovação.
- CT-04: EOF e uma tentativa de restauração auxiliar falha exigiram reabrir o navegador; a mesma sessão e proposta v1 foram restauradas e confirmadas uma vez. Consulta por ID retornou 404; GET pelo protocolo correto retornou 200.
- CT-05: pausa do executor após o terceiro turno por interpretação excessivamente restritiva do complemento permitido; retomou-se a mesma sessão para fornecer o número fictício solicitado. Não houve nova conversa.
- Após confirmação, a interface limpa a sessão ativa do storage. Auxiliares de CT-01/CT-06 precisaram usar o identificador guardado antes do clique para ler a memória isolada. Essa limpeza observada não foi tratada como defeito.

Os incidentes permanecem nos relatórios e evidências correspondentes; não foram escondidos por alteração de assertions, código da aplicação ou resultado esperado.

## Resultados individuais: passos, esperado e observado

### CT-01 — Registro confirmado e protocolo único

**Resultado:** APROVADO. **Rastreabilidade:** RF002, RF003, HU002. **Sessão:** `[ID de sessão omitido]`.

**Esperado:** Demanda registrada após confirmação; protocolo único exibido ao cidadão e vinculado àquela demanda (RF002/RF003/HU002), sem exigir máscara.

**Observado:** Proposta v1 na primeira mensagem. Somente após clicar confirmação foi criada a demanda 108, protocolo GR-20261117-R0IMB, exibido no portal e recuperado pelo mesmo protocolo. Uma linha vinculada à sessão e nenhuma duplicidade no banco isolado.

Passos executados:

1. Entrar no modo demonstrativo como Cidadão e abrir atendimento novo Observado: Portal de conversa acessível; banco prévio com 107 demandas, nenhuma de chat
2. Enviar o relato exato de CT-01 pela UI Entrada: “O bueiro próximo à Rua 10, Setor Central, Goiânia, está danificado e precisa de vistoria e reparo.”. Observado: Proposta v1 preparada na primeira resposta; sem complementação solicitada; estado AWAITING_CONFIRMATION
3. Conferir proposta e ausência de formalização antes de aprovar Observado: Protocolo ausente na UI/sessão; nenhuma demanda vinculada à sessão no banco
4. Clicar Confirmar e gerar protocolo Observado: HTTP 201; success=true; demanda 108; protocolo GR-20261117-R0IMB
5. Consultar demanda por protocolo via HTTP autenticado do mesmo cidadão e comparar SQLite isolado Observado: HTTP 200; protocolo/demanda/sessão vinculados; uma nova demanda e um histórico; sem duplicidades

| Verificação | Resultado |
|---|---|
| Sem registro/protocolo da sessão antes da aprovação | ATENDIDA |
| Aprovação humana pelo portal registra a proposta | ATENDIDA |
| Protocolo apresentado ao cidadão | ATENDIDA |
| Vínculo entre protocolo, demanda e sessão | ATENDIDA |
| Unicidade no banco de testes observado | ATENDIDA |
| Uso real do provedor de IA | ATENDIDA |

Evidências e comparação detalhada: [relatório individual](CT-01/relatorio.md), [resultado estruturado](CT-01/result.json), [eventos](CT-01/events.json), [resumo HTTP sem tokens ou corpos de relato](CT-01/http-summary.json) e [escopo das evidências publicadas](CT-01/evidence.json).

Limites do veredito:

- Uma execução e uma proposta; a unicidade é verificada no estado observado do banco isolado, não é prova para toda execução futura.
- Não avalia gov.br oficial, disponibilidade do setor, prazo de atendimento ou critério de desempenho RNF003; 2,364 s é medição observacional do HTTP de confirmação.
- Banco isolado contém 107 demandas fictícias de seed anteriores ao caso; nenhuma delas tinha chat_session_id. Houve somente um novo registro do caso.
- O helper não encontra a sessão via sessionStorage após confirmação porque a UI limpa a sessão ativa; o arquivo local foi lido pelo identificador já capturado, sem alterar estado.
- Incidentes do executor: primeira abertura sem PTY encerrou antes de qualquer relato; reabertura com PTY foi a única conversa executada. Consulta inicial /demands/108 recebeu 404 porque a rota consulta por protocolo; a consulta correta /demands/GR-20261117-R0IMB retornou 200. Ambos são registrados sem atribuí-los ao produto.

### CT-02 — Relato insuficiente antes da formalização

**Resultado:** APROVADO. **Rastreabilidade:** RF002, HU002. **Sessão:** `[ID de sessão omitido]`.

**Esperado:** O fluxo solicita esclarecimentos para coletar a descrição da situação/atendimento e não conclui o registro nem fornece protocolo com o relato insuficiente (RF002/HU002), sem exigir frase, campo único ou ordem de coleta não especificados.

**Observado:** O chatbot pediu o endereço/ponto de referência como esclarecimento progressivo e permaneceu COLLECTING. A natureza do problema e o atendimento desejado ainda não foram coletados. Não houve proposta, confirmação, demanda da sessão ou protocolo. Uma mensagem, HTTP 200, duas chamadas reais de IA HTTP 200, zero novos registros no banco isolado.

Passos executados:

1. Entrar como cidadão no portal demonstrativo em contexto Chrome isolado e iniciar nova reclamação Observado: Nova conversa; nenhuma sessão ativa anterior no contexto; banco prévio preservado
2. Enviar somente a frase genérica pela UI Entrada: “Quero reclamar de um problema na rua”. Observado: Qual é o endereço do problema, com rua, número e bairro? Se não souber o número, informe um ponto de referência.
3. Observar resposta sem complementar, sem aprovar e sem chamar confirmação Observado: COLLECTING; sem proposta, botão de confirmação ou tela Demanda registrada!; nenhum protocolo da sessão
4. Conferir snapshots read-only do banco de testes e encerrar navegador/runner Observado: Zero novas demandas/históricos; nenhuma demanda da sessão CT-02; execução concluída e navegador encerrado

| Verificação | Resultado |
|---|---|
| Entrada exata em nova sessão, sem complementação/aprovação | ATENDIDA |
| Pedido de esclarecimento progressivo sobre a situação | ATENDIDA |
| Coleta permanece aberta sem proposta pronta | ATENDIDA |
| Ausência de formalização/protocolo da sessão | ATENDIDA |
| Banco isolado sem novos registros/históricos neste caso | ATENDIDA |
| Uso real do provedor de IA, sem mocks | ATENDIDA |

Evidências e comparação detalhada: [relatório individual](CT-02/relatorio.md), [resultado estruturado](CT-02/result.json), [eventos](CT-02/events.json), [resumo HTTP sem tokens ou corpos de relato](CT-02/http-summary.json) e [escopo das evidências publicadas](CT-02/evidence.json).

Limites do veredito:

- Uma execução e somente o primeiro turno, conforme CT-02. O cidadão não informou localização, natureza do problema ou atendimento pretendido após a pergunta; não se avalia o que o fluxo faria em turnos futuros.
- O pedido observado esclarece a localização. Não perguntou qual era a ocorrência nem qual atendimento desejado naquele turno. A aprovação cobre esclarecimento progressivo e ausência de formalização; não declara a descrição já coletada ou validada. RF002/CT-02 não fixam ordem de coleta, campo universal ou frase obrigatória.
- O banco contém seed fictício e o registro do CT-01 anterior. A análise filtra a sessão CT-02 e compara os snapshots; não considera o protocolo do CT-01 como saída deste caso.
- Duração de chat é observacional; CT-02 não mede tempo de confirmação, gov.br oficial, encaminhamento ao órgão ou desempenho futuro.
- O executor concluiu com browser/contexto/Playwright fechados e sem exceção. Não houve repetição do caso, complemento, confirmação ou alteração de código/configuração.

### CT-03 — Revisão do relato antes da aprovação

**Resultado:** REPROVADO. **Rastreabilidade:** RF002, RF009, HU002. **Sessão:** `[ID de sessão omitido]`.

**Esperado:** Nova versão da ficha reflete Rua 12 sem substituir indevidamente os demais fatos; demanda ainda não formalizada e sem protocolo antes de confirmação (RF002/RF009/HU002).

**Observado:** Ajuste pela UI gerou v2 com Rua 12 no título/logradouro, mantendo Setor Central, bueiro danificado e vistoria/reparo. Porém a referência corrente continua próximo à Rua 10 e é repetida na descrição factual, deixando a correção de local inconsistente. Zero novas demandas/protocolos e nenhuma aprovação.

Passos executados:

1. Entrar como cidadão em contexto Chrome novo; enviar relato fictício pela UI Entrada: “O bueiro próximo à Rua 10, Setor Central, Goiânia, está danificado e precisa de vistoria e reparo.”. Observado: Proposta v1 imediatamente, Rua 10/Setor Central, sem complementos solicitados
2. Acionar Não, quero ajustar na proposta, sem aprovar Observado: Mensagem Tudo bem. A ficha ainda não será registrada. O que você quer corrigir ou acrescentar?; entrada de conversa disponível
3. Corrigir o local pela entrada da conversa Entrada: “Corrija o local para Rua 12, no mesmo Setor Central, Goiânia. Os demais fatos permanecem: o bueiro está danificado e solicito vistoria e reparo.”. Observado: Resposta HTTP 200; proposta v2 com Rua 12 no título e logradouro, mas referência corrente próximo à Rua 10
4. Comparar ficha/estado/banco sem clicar confirmação; encerrar executor Observado: Demais fatos preservados; ausência de aprovação/protocolo; zero novas demandas/históricos; browser/contexto/Playwright fechados

| Verificação | Resultado |
|---|---|
| Proposta inicial obtida e ajuste acionado pela UI | ATENDIDA |
| Nova versão reflete Rua 12 no logradouro e título | ATENDIDA |
| Consistência da localização na ficha corrigida | NÃO ATENDIDA |
| Demais fatos preservados | ATENDIDA |
| Sem aprovação ou formalização da sessão | ATENDIDA |
| Nenhuma nova demanda/histórico no banco isolado | ATENDIDA |
| IA real e executor concluído sem erro | ATENDIDA |

Evidências e comparação detalhada: [relatório individual](CT-03/relatorio.md), [resultado estruturado](CT-03/result.json), [eventos](CT-03/events.json), [resumo HTTP sem tokens ou corpos de relato](CT-03/http-summary.json) e [escopo das evidências publicadas](CT-03/evidence.json).

Limites do veredito:

- Uma única sessão e uma execução com dois turnos. Não houve repetição buscando resultado favorável, nova correção, confirmação ou teste de persistência da ficha revisada após aprovação.
- O juízo de falha é de consistência semântica da ficha apresentada após a correção explícita do local. Não exige apagamento de histórico ou cópia literal do texto; o campo corrente PONTO DE REFERÊNCIA é a evidência principal.
- A relação geográfica real entre Rua 10 e Rua 12 não foi investigada e não é presumida. Todos os dados são fictícios. O problema identificado é a referência anterior mantida sem reconciliação após o pedido de corrigir o local.
- Banco isolado contém seed fictício e o registro anterior do CT-01. A avaliação filtra a sessão CT-03 e compara contagens; o protocolo do CT-01 não foi emitido por este caso.
- Chamadas de IA são reais e observacionais; os resultados não estimam taxa de erro futura, robustez ou desempenho. Nenhum código/configuração versionada/.env foi alterado.

### CT-04 — Classificação e destino conforme catálogo

**Resultado:** APROVADO. **Rastreabilidade:** RF008, RF010, HU008. **Sessão:** `[ID de sessão omitido]`.

**Esperado:** Reclamação classificada como problema pertinente a bueiros e órgão sugerido/associado SEINFRA conforme catálogo demonstrativo, com confirmação e destino informado no registro (RF008/RF010/HU008), sem afirmar encaminhamento concluído sem evidência da fila do setor.

**Observado:** Proposta v1 no primeiro turno: Infraestrutura e Iluminação Pública, relato de bueiro e SEINFRA. Confirmação pela UI criou GR-20261117-HPFE8 (id109); GET por protocolo e SQLite isolado comprovam associação SEINFRA. RF010 quanto à fila do setor não foi avaliado.

Passos executados:

1. Entrar na demonstração como cidadão em contexto novo e enviar dado inicial exato Entrada: “Bueiro quebrado na Rua 10, Setor Central, Goiânia. Solicito reparo.”. Esperado no passo: Proposta ou perguntas necessárias Observado: Proposta v1 imediata; 1 turno HTTP200, 3,034s, sem complementos.
2. Conferir categoria, relato e sugestão do órgão Esperado no passo: Problema de bueiro com SEINFRA Observado: Categoria Infraestrutura e Iluminação Pública, relato bueiro quebrado/pedido de reparo e sugestão SEINFRA.
3. Retomar a mesma sessão após incidente do auxiliar e aprovar pelo botão real Esperado no passo: Mesma proposta e um registro após confirmar Observado: Proposta v1 restaurada, clique Confirmar e gerar protocolo, HTTP201 em1,745s, demanda109, protocolo GR-20261117-HPFE8.
4. Consultar demanda por protocolo e conferir vínculo no SQLite isolado Esperado no passo: Registro e destino SEINFRA persistidos Observado: GET HTTP200; department.id1/nomeSEINFRA; banco department_id1/codeSEINFRA, uma demanda desta sessão.
5. Verificar capturas e fechar recursos; consolidar evidências Esperado no passo: Evidências reais e nenhum processo de navegador do executor ativo Observado: Capturas da proposta e confirmação inspecionadas; contexto/browser/Playwright encerrados;3 chamadas IA reais HTTP200. Limite RF010 mantido.

| Verificação | Resultado |
|---|---|
| Proposta obtida pelo relato previsto | ATENDIDA |
| Classificação pertinente a bueiros | ATENDIDA |
| Órgão sugerido conforme catálogo | ATENDIDA |
| Aprovação explícita e protocolo pela UI | ATENDIDA |
| Destino associado consultável pelo cidadão | ATENDIDA |
| Persistência isolada com associação ao destino | ATENDIDA |
| Execução real e recursos encerrados | ATENDIDA |

Evidências e comparação detalhada: [relatório individual](CT-04/relatorio.md), [resultado estruturado](CT-04/result.json), [eventos](CT-04/events.json), [resumo HTTP sem tokens ou corpos de relato](CT-04/http-summary.json) e [escopo das evidências publicadas](CT-04/evidence.json).

Limites do veredito:

- Uma sessão real, uma proposta v1 e uma confirmação. Não houve repetição buscando resultado favorável, mocks, paralelismo ou alteração de código/configuração/.env.
- RF010 exige disponibilidade para consulta pelo setor destinatário para considerar encaminhamento concluído. Este caso comprova sugestão/associação a SEINFRA e consulta pelo cidadão; não abriu nem avaliou fila do servidor e não comprova encaminhamento concluído.
- Catálogo é demonstrativo do projeto acadêmico. A associação local não constitui comunicação ou integração com atendimento oficial.
- Categoria pertinente avaliada por semântica e catálogo; não se exigiu classe textual literal bueiros, SLA ou código HTTP específico para aprovação. Os HTTPs e tempos registrados são observações.
- Interrupções do executor exigiram reabertura de navegador e login do mesmo cidadão de demonstração; retomou-se a mesma sessão do backend, com o mesmo relato e proposta, sem novo chat. Os tempos de chat/confirm não incluem a recuperação; duração total inclui.
- Banco isolado possui seed fictício e demanda anterior CT-01; comparação por sessão e contagens distingue o novo registro CT-04. Não foram acessados dados reais.
- 3 respostas de IA reais HTTP200 demonstram execução desta amostra, sem estimar confiabilidade ou desempenho futuro.

### CT-05 — Preservação dos fatos na proposta

**Resultado:** APROVADO. **Rastreabilidade:** RF009, RNF007, HU007. **Sessão:** `[ID de sessão omitido]`.

**Esperado:** RF009/RNF007/HU007: proposta preserva bueiro danificado, ausência declarada de feridos e vistoria/reparo, sem vítimas, causas, datas ou fatos não informados; comparação semântica, sem exigir cópia literal.

**Observado:** Proposta v1 obtida após4 turnos,3 complementos solicitados. Descrição e slots preservam relato inicial e complementos fictícios, incluindo ausência de feridos e vistoria/reparo. Nenhum fato não informado; nenhuma aprovação, protocolo ou nova demanda.

Passos executados:

1. Abrir contexto novo, entrar como cidadão demonstrativo e enviar o relato exato Entrada: “O bueiro está danificado. Ninguém ficou ferido. Preciso de vistoria e reparo.”. Esperado no passo: Coletar dados ou propor ficha sem modificar fatos. Observado: Qual é o endereço do bueiro, com rua ou avenida, número, bairro ou um ponto de referência?
2. Informar o endereço fictício solicitado Entrada: “Rua 10, Setor Central, Goiânia.”. Esperado no passo: Localização incorporada; eventual pergunta de complemento. Observado: Qual é o número do imóvel ou um ponto de referência próximo ao bueiro?
3. Responder ao pedido de referência sem inventar ocorrência Entrada: “Não tenho um ponto de referência adicional.”. Esperado no passo: Pergunta adicional se a localização ainda for insuficiente. Observado: Pode informar o número do imóvel mais próximo do bueiro?
4. Retomar a mesma sessão e responder com número100 fictício solicitado Entrada: “O bueiro fica em frente ao número 100 da Rua 10, Setor Central, Goiânia.”. Esperado no passo: Gerar proposta para revisão conservando os fatos. Observado: Proposta v1 obtida, AWAITING_CONFIRMATION, órgão SEINFRA, categoria Infraestrutura e Iluminação Pública; nenhum novo relato ou sessão.
5. Ler e comparar semanticamente proposta, entradas e slots sem aprovar Esperado no passo: Mesmo problema, ausência de feridos e pedido; nenhum fato inventado. Observado: Todos preservados; referência em frente ao número100 deriva explicitamente do terceiro complemento. Sem vítimas, causas, datas ou risco acrescentados.
6. Conferir ausência de formalização na UI/HTTP/sessão/SQLite isolado e encerrar recursos Esperado no passo: Nenhum protocolo, confirmação ou nova demanda. Observado: Zero POST confirm; protocolos da sessão nulos; zero linha para sessão; contagens109 demandas/134 históricos inalteradas;8 IA HTTP200; recursos fechados.

| Verificação | Resultado |
|---|---|
| Relato previsto e complementos solicitados | ATENDIDA |
| Problema preservado | ATENDIDA |
| Ausência de feridos preservada | ATENDIDA |
| Atendimento solicitado preservado | ATENDIDA |
| Nenhum fato não informado na proposta | ATENDIDA |
| Proposta sem aprovação, registro ou protocolo | ATENDIDA |
| Execução real e recursos encerrados | ATENDIDA |

Evidências e comparação detalhada: [relatório individual](CT-05/relatorio.md), [resultado estruturado](CT-05/result.json), [eventos](CT-05/events.json), [resumo HTTP sem tokens ou corpos de relato](CT-05/http-summary.json) e [escopo das evidências publicadas](CT-05/evidence.json).

Limites do veredito:

- Uma amostra real com uma sessão, uma proposta v1 e quatro turnos de chat. Não mede confiabilidade geral do modelo nem garante outros relatos.
- O número100 é dado fictício fornecido pelo testador em resposta à pergunta, não inferência ou invenção do sistema. A frase anterior sobre não possuir referência adicional permanece na transcrição histórica da proposta; o complemento posterior fornece o número. Isso foi considerado no julgamento semântico.
- A descrição é majoritariamente concatenação das falas, com separadores | e pontuação final duplicada; preserva fatos nesta amostra. O caso exige fidelidade semântica, não cópia literal nem um estilo específico de síntese.
- HU007 foi usada como referência de fidelidade do conteúdo produzido; não foi aberta a tela do servidor nem avaliada consulta posterior pelo setor.
- A proposta não foi aprovada nem registrada, conforme escopo. Não houve classificação formal de gravidade nesta sessão; considerações de risco de demandas anteriores no seed/banco não pertencem a este caso.
- Os campos approved_title/approved_description da memória estão preenchidos antes do clique, mas não constituem evidência de aprovação: estado AWAITING_CONFIRMATION, approved_proposal_version nulo, protocolos nulos, nenhum POST confirm e zero demanda comprovam a ausência de formalização.
- A pausa do auxiliar exigiu reabertura do navegador e login do mesmo cidadão de demonstração; a sessão do backend e suas quatro mensagens do cidadão foram preservadas, sem refazer o caso.
- Execução exclusivamente local no banco isolado; nenhuma modificação de aplicação/configuração/.env, nenhum commit/push nem acesso a dados reais.

### CT-06 — Gravidade somente depois da aprovação

**Resultado:** APROVADO. **Rastreabilidade:** RF016, HU014. **Sessão:** `[ID de sessão omitido]`.

**Esperado:** RF016/HU014: classificação formal de gravidade somente após aprovação humana, nível CRITICA/ALTA/MEDIA/BAIXA e justificativa técnica, sem predeterminar nível ou SLA; indicar provisório se aplicável.

**Observado:** Proposta v1 obtida no primeiro turno, sem demanda nem gravidade formal antes de aprovar. Após clique UI, a IA classificou MEDIA com parecer contextual, salvou demanda110 e exibiu protocolo GR-20261117-N2QOU. Gravidade e justificativa conferidas em HTTP, UI e SQLite;3 chamadas reais IA HTTP200, uma durante formalização; sem fallback.

Passos executados:

1. Abrir contexto novo e entrar no portal como cidadão demonstrativo Esperado no passo: Atendimento novo em ambiente de testes. Observado: UI local acessível;109 demandas e134 históricos pré-existentes no banco isolado.
2. Enviar relato fictício exato do bueiro pela UI Entrada: “O bueiro próximo à Rua 10, Setor Central, Goiânia, está danificado e precisa de vistoria e reparo.”. Esperado no passo: Proposta completa ou pedido de complemento sem gravidade predefinida. Observado: Proposta v1 na primeira resposta; zero complementos; estado AWAITING_CONFIRMATION.
3. Inspecionar proposta, sessão, UI, banco e recorte de logs antes de aprovar Esperado no passo: Sem gravidade final, aprovação, demanda ou protocolo formal. Observado: Sem gravidade no resumo; versão aprovada/protocolos nulos; zero linha vinculada; sem FormalizationAgent no recorte pré-aprovação.
4. Clicar Confirmar e gerar protocolo uma única vez Esperado no passo: Iniciar avaliação de gravidade após aprovação e registrar resultado. Observado: Clique06:45:46.682343Z; avaliação06:45:46.706–48.282Z; HTTP201 às06:45:48.334757Z; demanda110 e protocoloGR-20261117-N2QOU.
5. Conferir tela e consultar demanda por protocolo no mesmo cidadão Esperado no passo: Nível válido e parecer técnico correspondentes ao registro persistido. Observado: MEDIA com justificativa contextual na UI, confirmação, GET200 e SQLite; sessãoFORMALIZED e versão aprovada1.
6. Encerrar navegador e runner, inspecionar evidências e consolidar resultado Esperado no passo: Sem concorrência; distinguir problemas do produto e dos auxiliares. Observado: Recursos fechados; exit0; nenhuma exceção no runner;7/7 critérios satisfeitos; divergência de status registrada separadamente.

| Verificação | Resultado |
|---|---|
| Proposta completa sem gravidade formal anterior à aprovação | ATENDIDA |
| Classificação formal ocorre depois do clique de aprovação | ATENDIDA |
| Nível pertence ao contrato documentado | ATENDIDA |
| Justificativa técnica contextual e avaliação real de IA | ATENDIDA |
| Gravidade e justificativa persistidas e exibidas no mesmo registro | ATENDIDA |
| Aprovação vincula a versão revisada e cria somente uma demanda | ATENDIDA |
| Sem prazo inventado no resultado | ATENDIDA |

Evidências e comparação detalhada: [relatório individual](CT-06/relatorio.md), [resultado estruturado](CT-06/result.json), [eventos](CT-06/events.json), [resumo HTTP sem tokens ou corpos de relato](CT-06/http-summary.json) e [escopo das evidências publicadas](CT-06/evidence.json).

Limites do veredito:

- Uma execução real, uma sessão e uma versão de proposta; não mede robustez estatística do modelo nem valida a escolha de nível para todos os relatos.
- Não há limiar numérico documentado para impor um nível específico; MEDIA é o resultado observado, não uma expectativa fixa.
- Ramo de fallback provisório não ocorreu. A tela04 de referência mostra um exemplo provisório; ela não exige reproduzir indisponibilidade da IA.
- As chamadas HTTP200 são corroboradas por logs naturais da aplicação; não houve mock, monkeypatch ou instrumentação adicional do código.
- Após confirmação, a UI limpa a chave da sessão ativa. A primeira tentativa auxiliar de ler a sessão pelo helper retornou null; a evidência pós-aprovação foi recuperada do arquivo da mesma sessão usando o identificador capturado antes do clique, sem nova interação.
- Limite operacional: no máximo seis complementos solicitados; não utilizado porque a primeira resposta gerou proposta completa.

### CT-07 — Cancelar proposta antes de registrar

**Resultado:** APROVADO. **Rastreabilidade:** RF002, RF003, HU002. **Sessão:** `[ID de sessão omitido]`.

**Esperado:** RF002/RF003/HU002: proposta cancelada antes da aprovação não é formalizada e não recebe protocolo; fluxo sem confirmação de registro.

**Observado:** Proposta v1 obtida no primeiro turno. Clique X da UI cancelou com HTTP 200/CANCELLED, mensagem visível e nenhum protocolo. Memória e GET confirmaram cancelamento; zero demanda vinculada e totais do banco 110/135 inalterados. Duas chamadas reais IA HTTP 200.

Passos executados:

1. Abrir contexto novo e entrar no portal como cidadão demonstrativo Esperado no passo: Atendimento novo em ambiente de testes. Observado: Portal local acessível; banco isolado com 110 demandas e 135 históricos pré-existentes.
2. Enviar relato fictício de bueiro danificado pela UI Entrada: “O bueiro próximo à Rua 10, Setor Central, Goiânia, está danificado e precisa de vistoria e reparo.”. Esperado no passo: Proposta para revisão, completando apenas o necessário se solicitado. Observado: Proposta v1 já na primeira resposta; nenhum complemento; duas chamadas reais de IA HTTP 200.
3. Capturar identificador, sessão e ausência de demanda antes de cancelar Esperado no passo: Proposta ainda não aprovada e sem protocolo. Observado: AWAITING_CONFIRMATION; approved_proposal_version/formalized_protocol/registered_protocol nulos; zero linha pelo session_id.
4. Acionar X com title Cancelar esta solicitação antes da autuação Esperado no passo: Não formalizar a reclamação. Observado: POST /cancel retornou HTTP 200/CANCELLED em 0.06 s; mensagem de cancelamento apareceu.
5. Conferir UI, GET da sessão, memória e SQLite isolado após a desistência Esperado no passo: Sem confirmação de registro, protocolo ou demanda da sessão. Observado: Ausência confirmada nas evidências; sessão CANCELLED e zero demanda vinculada; totais 110/135 inalterados.
6. Encerrar contexto/navegador e consolidar registro local Esperado no passo: Execução serial encerrada antes do próximo caso. Observado: Runner standalone exit 0; nenhuma exceção; recursos do navegador fechados pelo helper.

| Verificação | Resultado |
|---|---|
| Proposta exibida e ainda não aprovada antes do cancelamento | ATENDIDA |
| Cancelamento acionado pelo botão X da proposta | ATENDIDA |
| Interface não confirma registro nem exibe protocolo após cancelar | ATENDIDA |
| Sessão cancelada sem protocolo formal ou aprovação | ATENDIDA |
| Nenhuma demanda ou histórico novo no banco isolado | ATENDIDA |

Evidências e comparação detalhada: [relatório individual](CT-07/relatorio.md), [resultado estruturado](CT-07/result.json), [eventos](CT-07/events.json), [resumo HTTP sem tokens ou corpos de relato](CT-07/http-summary.json) e [escopo das evidências publicadas](CT-07/evidence.json).

Limites do veredito:

- Uma execução real em uma sessão e proposta; não mede robustez estatística da IA.
- Não se exige uma mensagem literal, remoção completa dos dados da sessão ou possibilidade de retomada: esses comportamentos não foram definidos no CT-07.
- A UI retirou o cartão e limpou a chave ativa do sessionStorage; a memória e o GET conservaram a proposta com estado CANCELLED. São observações sem reprovação, conforme a pendência delimitada do caso.
- Não foi tentada confirmação, retomada ou nova conversa após cancelar; estão fora deste caso.
- As duas chamadas reais de IA HTTP 200 são evidenciadas pelos logs naturais do backend; sem mock, monkeypatch, alteração de código ou nova instrumentação.
- Limite operacional de seis complementos não foi utilizado: a primeira resposta já produziu proposta completa.

### CT-08 — Repetir confirmação da mesma proposta

**Resultado:** APROVADO. **Rastreabilidade:** RF003, HU002. **Sessão:** `[ID de sessão omitido]`.

**Esperado:** RF003/HU002 e diagramas: repetir a confirmação da mesma sessão/cidadão/versão retorna o mesmo protocolo e a mesma demanda, sem segundo cadastro; sem exigir código HTTP específico.

**Observado:** Primeira confirmação pela UI e repetição sequencial do corpo original retornaram HTTP201, protocolo GR-20261117-DFJ3Z e demanda111. Banco e histórico não cresceram na repetição;5/5 critérios atendidos.

Passos executados:

1. Abrir portal e entrar como cidadão demonstrativo em contexto novo. Esperado no passo: Nova sessão em ambiente isolado. Observado: Portal local disponível;110 demandas e135 históricos prévios no banco de testes.
2. Enviar relato fictício pela UI e capturar identificadores antes de confirmar. Esperado no passo: Proposta completa para revisão, ainda sem registro. Observado: Proposta v1 no primeiro turno; AWAITING_CONFIRMATION; nenhuma demanda da sessão; nenhum complemento.
3. Confirmar pelo botão UI; aguardar resposta integral e consultar banco antes de reenviar. Esperado no passo: Formalização com protocolo e demanda identificáveis. Observado: HTTP201 em2,18s, protocolo GR-20261117-DFJ3Z/demanda111; uma demanda e um histórico desta sessão.
4. Reenviar o JSON capturado para o mesmo endpoint da mesma sessão, no mesmo contexto/cidadão. Esperado no passo: Mesmo protocolo e mesma demanda, sem segunda criação. Observado: HTTP201 em0,014s; demanda111/protocolo idênticos; nenhum incremento de demandas ou históricos.
5. Consultar pelo protocolo, conferir sessão e tela; encerrar navegador e runner. Esperado no passo: Registro único confirmado e execução local serial encerrada. Observado: GET200 id111; sessãoFORMALIZED v1; browser/contexto fechados,runner exit0; status inicial da UI diverge do backend (incidental).

| Verificação | Resultado |
|---|---|
| Mesma sessão, proposta, versão e cidadão na repetição | ATENDIDA |
| Ambas as respostas retornam o mesmo protocolo | ATENDIDA |
| Ambas as respostas retornam a mesma demanda | ATENDIDA |
| Repetição não gera segundo cadastro nem histórico | ATENDIDA |
| Sessão mantém protocolo e versão aprovada | ATENDIDA |

Evidências e comparação detalhada: [relatório individual](CT-08/relatorio.md), [resultado estruturado](CT-08/result.json), [eventos](CT-08/events.json), [resumo HTTP sem tokens ou corpos de relato](CT-08/http-summary.json) e [escopo das evidências publicadas](CT-08/evidence.json).

Limites do veredito:

- Uma execução, uma sessão, uma proposta v1 e o mesmo cidadão. Não generaliza proibição de duas reclamações distintas.
- Confirmações estritamente sequenciais; concorrência, versões diferentes e cidadãos diferentes não foram testados.
- A segunda confirmação foi enviada à API pelo contexto autenticado porque a UI já concluiu e limpou a sessão ativa; identificadores foram capturados antes do primeiro clique.
- Repetiu-se o mesmo objeto JSON com proposal_id, approved_proposal_version e proposal_version; equivalência dos campos é comprovada, não se pretende medir identidade dos bytes de serialização HTTP.
- Três chamadas reais de IA HTTP200 nos logs naturais: duas preparando a ficha e uma na primeira formalização. A repetição não gerou nova chamada de IA; sem mocks ou alteração da aplicação.
- Tempos observados nesta execução, sem critério de SLA. Limite de seis complementos não utilizado; nenhuma repetição de caso para obter aprovação.
- O helper redige automaticamente qualquer chave contendo token, inclusive um booleano de comparação; nenhum token/header de autorização foi gravado. Cidadão2 é corroborado nas respostas e na sessão.

## Limitações gerais e fontes

- Uma campanha e uma sessão por caso, com IA probabilística real; não se estima robustez estatística, precisão global, custo, tokens, segurança ou desempenho sob carga.
- CT-02 observa somente um turno: pediu localização e não formalizou, mas não esclareceu ainda a natureza do problema/atendimento. A aprovação é qualificada por esse limite; não se inventou ordem obrigatória de perguntas.
- CT-04 comprova sugestão e associação a SEINFRA, com uma categoria ampla pertinente ao relato. Não prova disponibilidade na fila do servidor, logo não aprova integralmente RF010/RNF006.
- CT-06 verifica ordem temporal e contrato da gravidade com justificativa; não estabelece a correção universal do nível MEDIA nem limiar de risco. O fallback provisório não foi exercitado.
- CT-07 não avalia retenção, retomada ou confirmação de uma proposta cancelada; CT-08 avalia apenas repetição sequencial da mesma sessão/versão/cidadão.
- Não foram testados gov.br oficial, atendimento posterior pelo órgão, autenticação de produção, notificações, feedback, dashboard, integração oficial municipal, suite legada completa ou todos os RNFs. Não houve alteração de código para fazer um caso passar.
- Os dados dos testes são fictícios; o catálogo e a autenticação são demonstrativos. O banco foi compartilhado sequencialmente pela campanha, com identificação por sessão e snapshots; não houve paralelismo nem limpeza entre casos que ocultasse registros anteriores.
- Não houve migração ou backup dos bancos locais descartados na sincronização inicial autorizada. Durante a campanha usou-se somente o SQLite isolado recém-criado; nenhum banco real externo foi conectado.
- Requisitos não enumeram campos obrigatórios por categoria, frases literais ou limites numéricos de gravidade. Esses critérios não foram inventados; as pendências documentais foram mantidas.
- A auditoria dos artefatos de evidência encontrou zero valores das credenciais configuradas e zero JWTs em texto. Isso é uma conferência direcionada aos segredos existentes e aos formatos examinados, não uma auditoria geral de segurança. [Auditoria dos artefatos](publication-scope.json).

Fontes locais consultadas no commit avaliado:

- [Casos finais](../../../../docs/atividades/checkpoint3-testes-funcionais/04_oito_casos_finais.md), README da atividade e arquivos 01, 02, 03 e 05 da mesma pasta.
- [Especificação RF/RNF/HU](../../../../docs/especificacao-requisitos.md).
- [Classes](../../../../docs/apresentacao/diagramas/01_classes.md), [componentes](../../../../docs/apresentacao/diagramas/02_componentes.md), [sequência](../../../../docs/apresentacao/diagramas/03_sequencia.md) e [fluxo multiagente](../../../../docs/apresentacao/diagramas/04_multiagentes_tools.md).
- [Tela02](../../../../docs/apresentacao/telas/02_conversa.png), [tela03](../../../../docs/apresentacao/telas/03_revisao.png), [tela04](../../../../docs/apresentacao/telas/04_protocolo.png), [catálogo](../../../../docs/orgaos-competentes.md) e [ProposalCard](../../../../frontend/src/components/chat/ProposalCard.tsx).

O enunciado institucional citado na atividade não foi consultado externamente; os oito casos finais e os requisitos versionados foram as fontes do esperado desta execução. As referências locais acima permaneceram sem alteração.

Arquivos de apoio: [consolidação JSON](README.md), [banco de testes](README.md), [integridade final](integrity-summary.json), [versões](environment-summary.json) e [encerramento](execution-closure.json). Relatório e auxiliares permanecem fora da árvore Git da aplicação.
