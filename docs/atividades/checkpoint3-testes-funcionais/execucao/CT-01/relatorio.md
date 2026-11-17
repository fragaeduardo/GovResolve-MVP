# CT-01 — Registro confirmado e protocolo único

**Resultado: APROVADO**, com uma divergência incidental de status registrada abaixo. Execução real em 17/11/2026, 2026-11-17T06:14:57.830447+00:00 a 2026-11-17T06:16:08.217910+00:00 (UTC; horário local America/Sao_Paulo = UTC−3). Repositório no commit `8e058e8e8bf883fbf19b92db8d8e350fa5042d92`.

## Escopo e fontes

Caso CT-01 de `docs/atividades/checkpoint3-testes-funcionais/04_oito_casos_finais.md`, RF002/RF003 e HU002 de `docs/especificacao-requisitos.md`, fluxo de `docs/apresentacao/diagramas/03_sequencia.md` e tela de referência `docs/apresentacao/telas/04_protocolo.png`. O critério é confirmar o registro e a associação de protocolo único; a máscara do identificador não é exigida.

Portal real `http://127.0.0.1:5173`, backend local, Chrome headless via Playwright e perfil Cidadão da demonstração. Nenhum mock, injeção de estado ou alteração do código. A aplicação utiliza a configuração e a credencial preexistentes; o `.env` não foi lido pelo executor do caso nem alterado. SQLite e memória do atendimento isolados fora do repositório. Dados do relato e do seed são fictícios.

## Passos realizados

1. Acessar o portal e entrar como Cidadão na demonstração. Abrir atendimento novo. Capturar UI e banco inicial: 107 demandas de seed; nenhuma demanda de chat.
2. Enviar exatamente: “O bueiro próximo à Rua 10, Setor Central, Goiânia, está danificado e precisa de vistoria e reparo.” O chatbot respondeu com proposta v1, sem pedir complementos, sugerindo SEINFRA e apresentando ficha para revisão. Foi usada uma única sessão: `[ID de sessão omitido]`.
3. Conferir a ficha e o estado anterior à aprovação: `AWAITING_CONFIRMATION`, `approved_proposal_version=null`, `formalized_protocol=null`, sem protocolo na UI e sem demanda de chat no SQLite. Evidências: [sessão](evidence.json), [banco](database-summary.json), [tela](pre-confirmacao.png).
4. Clicar **Confirmar e gerar protocolo** pela UI. A confirmação retornou HTTP 201 com `success=true`, demanda **108** e protocolo **GR-20261117-R0IMB**. A tela passou a “Demanda registrada!” e exibiu esse protocolo. Evidências: [resumo HTTP sem tokens ou corpos de relato](http-summary.json), [eventos](events.json), [tela](pos-confirmacao.png).
5. Consultar `GET /api/v1/demands/GR-20261117-R0IMB` com a mesma identidade demonstrativa. HTTP 200 retornou a demanda 108. Conferir SQLite somente leitura: uma linha com o mesmo protocolo, cidadão 2 e sessão `[ID de sessão omitido]`; banco passou para 108 demandas e 133 históricos; nenhuma duplicidade de protocolo. Evidência: [banco após confirmação](database-summary.json).
6. Fechar o navegador e finalizar o executor. Nenhum servidor foi reiniciado.

## Esperado versus observado

| Verificação | Esperado | Observado | Resultado |
|---|---|---|---|
| Sem registro/protocolo da sessão antes da aprovação | Nenhuma demanda para a sessão e nenhum protocolo formalizado | AWAITING_CONFIRMATION; approved_proposal_version=null; formalized_protocol=null; nenhuma chat_demands no banco; UI com proposta v1 sem protocolo | PASSOU |
| Aprovação humana pelo portal registra a proposta | Registro iniciado pelo botão de confirmação | Clique em Confirmar e gerar protocolo; POST de confirmação HTTP 201 success=true; banco passou de 107 para 108 demandas e de 132 para 133 históricos | PASSOU |
| Protocolo apresentado ao cidadão | Protocolo não vazio exibido após confirmação, sem impor formato | GR-20261117-R0IMB exibido na tela Demanda registrada! | PASSOU |
| Vínculo entre protocolo, demanda e sessão | Mesmo protocolo na UI, resposta de confirmação, consulta e banco | GET /demands/GR-20261117-R0IMB HTTP 200: id=108; DB id=108, citizen_id=2, chat_session_id=[ID de sessão omitido], protocolo idêntico | PASSOU |
| Unicidade no banco de testes observado | Exatamente uma linha com o protocolo e sem duplicidade no banco observado | Uma nova demanda para a sessão; duplicates_protocols=[] antes/depois | PASSOU |
| Uso real do provedor de IA | Sem mocks; chamada real com a configuração existente | Três POST https://api.openai.com/v1/chat/completions HTTP 200 OK: 03:15:06,387; 03:15:07,716; 03:15:35,378 (America/Sao_Paulo). Não houve erro/fallback no trecho da execução. | PASSOU |

## Evidência de IA real

O [trecho do backend](evidence.json) contém três chamadas reais ao endpoint OpenAI `chat/completions`, todas HTTP 200 OK: linhas 174, 177 e 226. Elas ocorreram às 03:15:06,387, 03:15:07,716 e 03:15:35,378 no horário local. O [extrato de IA](evidence.json) reúne essas linhas sem credenciais. Não foi identificado erro ou fallback no trecho deste caso. A proposta e a justificativa de gravidade vieram do fluxo real; não foram substituídas pelo teste.

## Métricas

| Métrica | Observado |
|---|---:|
| Mensagens do cidadão | 1 |
| Complementações | 0 |
| Resposta do chat | 3,691 s |
| Resposta HTTP da confirmação após clique | 2,364 s |
| Novas demandas / históricos | 1 / 1 |
| Protocolos duplicados após o caso | 0 |
| Verificações do caso aprovadas | 6/6 |
| Chamadas reais de IA com HTTP 200 | 3 |

Os tempos são observações do executor e não uma avaliação do RNF003, excluído do CT-01.

## Problema encontrado

**CT01-INC01 — divergência entre status mostrado e persistido.** A tela final mostra **“Aberto (Autuado)”**; a resposta de confirmação, a consulta por protocolo e o histórico inicial retornam **“EM ANDAMENTO”**; SQLite contém `EM_ANDAMENTO`. Isso pode confundir o cidadão sobre o andamento. Evidências: [tela](pos-confirmacao.png), [texto da UI](pos-confirmacao-ui.txt), [HTTP/eventos](events.json), [banco](database-summary.json). Trata-se de observação incidental: o objetivo específico de geração, exibição e vínculo único do protocolo foi satisfeito. Nenhuma correção foi aplicada.

## Limitações e intercorrências do executor

- Uma execução e uma proposta; a unicidade é verificada no estado observado do banco isolado, não é prova para toda execução futura.
- Não avalia gov.br oficial, disponibilidade do setor, prazo de atendimento ou critério de desempenho RNF003; 2,364 s é medição observacional do HTTP de confirmação.
- Banco isolado contém 107 demandas fictícias de seed anteriores ao caso; nenhuma delas tinha chat_session_id. Houve somente um novo registro do caso.
- O helper não encontra a sessão via sessionStorage após confirmação porque a UI limpa a sessão ativa; o arquivo local foi lido pelo identificador já capturado, sem alterar estado.
- Incidentes do executor: primeira abertura sem PTY encerrou antes de qualquer relato; reabertura com PTY foi a única conversa executada. Consulta inicial /demands/108 recebeu 404 porque a rota consulta por protocolo; a consulta correta /demands/GR-20261117-R0IMB retornou 200. Ambos são registrados sem atribuí-los ao produto.

Não houve commits, pushes ou envio do `.env`. Resultado estruturado: [result.json](result.json).
