# 5. Rastreabilidade, decisões de projeto e análise crítica

## 5.1 Matriz de rastreabilidade — vínculo verificável entre fontes e oráculos

A matriz parte da **versão aprimorada** de [04_oito_casos_finais.md](04_oito_casos_finais.md). Cada linha registra a fonte de um resultado esperado; o código **E** ou **F** identifica o critério verificável do caso. A relação com um requisito **não significa cobertura completa** de todos os seus possíveis cenários.

| Requisito/história/artefato existente | Caso / oráculo | Situação coberta | Fonte consultada |
|---|---|---|---|
| RF002, HU002 | **CT-01/E1–E2** | Ficha revisável, aprovação e registro | [Especificação](../../especificacao-requisitos.md), [sequência 03](../../apresentacao/diagramas/03_sequencia.md), [tela 04](../../apresentacao/telas/04_protocolo.png) |
| RF003, HU002 | **CT-01/E2–E4** | Protocolo pós-confirmação, vínculo e unicidade | RF003, diagrama 01 (Demanda/protocolo), sequência 03 |
| RF002, HU002 | **CT-02/E1–E2** | Entrada sem problema/pedido identificado | RF002, [fluxo de dados faltantes 04](../../apresentacao/diagramas/04_multiagentes_tools.md) |
| RF003, sequência 03 | **CT-02/E3** | Ausência de protocolo sem formalização | RF003, sequência 03 |
| RF002, RF009, RNF007, HU002 | **CT-03/E1–E4** | Corrigir informação revogada, preservar fatos e não registrar antecipadamente | RF002/RF009/RNF007; sequência 03; [tela 03](../../apresentacao/telas/03_revisao.png) |
| RF008, catálogo | **CT-04/E1–E2** | Classificar lixo/limpeza e sugerir COMURG | RF008; [catálogo demonstrativo](../../orgaos-competentes.md) |
| RF003 | **CT-04/E3** | Protocolo da demanda encaminhada | RF003; sequência 03 |
| RF010, RF011, HU008 | **CT-04/E4** | **Disponibilidade efetiva da demanda ao órgão destinatário** | RF010/RF011; [componentes 02](../../apresentacao/diagramas/02_componentes.md); [tela 06](../../apresentacao/telas/06_servidor.png) |
| RNF006 | **CT-04/E5** | Não indicar encaminhamento concluído sem disponibilidade | RNF006; especificação |
| RF009, RNF007, HU007 | **CT-05/F1–F6** | Fidelidade semântica: problema, local, negação, incerteza, solicitação e ausência de invenções | RF009/RNF007; sequência 03; tela 03 |
| RF016, HU014 | **CT-06/E1–E3** | Momento pós-aprovação, quatro níveis, parecer e provisório quando aplicável | RF016/HU014; sequência 03; tela 04 |
| RF016 | **CT-06/E4** | Não anunciar prazo sem regra oficial | RF016; especificação |
| RF002, RF003, HU002; ação no protótipo | **CT-07/E1–E3** | Cancelar proposta antes de autuar, sem protocolo | RF002/RF003; [botão do cartão de proposta](https://github.com/fragaeduardo/GovResolve-MVP/blob/main/frontend/src/components/chat/ProposalCard.tsx); sequência 03 |
| RF003, HU002; classes/sequência | **CT-08/E1–E3** | Repetir mesma confirmação e recuperar o mesmo registro | RF003; [classes 01](../../apresentacao/diagramas/01_classes.md); sequência 03 |

### Por que o CT-04 ainda pertence à única funcionalidade escolhida?

O **objeto do teste continua sendo o registro e encaminhamento de uma reclamação**, não o tratamento pelo servidor. A **consulta somente-leitura** do registro recém-criado na fila da COMURG é a *evidência necessária para verificar RF010*, que define expressamente “encaminhamento concluído” como a **disponibilidade ao setor destinatário**. Sem essa consulta, seria incorreto declarar o RF010 integralmente testado. Não há atualização de status, parecer, conclusão ou avaliação como segunda funcionalidade.

### Limites da rastreabilidade

- **RF002:** a especificação não lista campos obrigatórios por tipo de reclamação; CT-02 usa a ausência explícita da **descrição do problema e da solicitação**, não inventa obrigatoriedade do endereço.
- **RF003:** CT-01 observa unicidade no conjunto de registros acessíveis; CT-08 verifica repetição sequencial **da mesma** sessão/versão/cidadão, não concorrência.
- **RF009/RNF007:** a análise semântica exige comparar **cada afirmação** com a entrada e eventuais complementos, sem forçar palavras idênticas.
- **RF010/RNF006:** sugestão e disponibilidade ao órgão são **eventos distintos**; o oráculo exige ambas.
- **RF016:** o documento fornece quatro rótulos e ordem pós-aprovação, **não fornece limiares de classificação**; um caso não mede precisão global da IA.
- **Valores-limite:** não há limites numéricos pertinentes claramente prescritos para os dados dessas reclamações; não se fabricaram comprimento mínimo/máximo, prazo, nota nem máscara. As fronteiras efetivamente documentadas são **pré/pós-aprovação**, **suficiente/insuficiente** e **primeira/repetida confirmação**.

## 5.2 Ferramenta de IA e processo de elaboração

A ferramenta foi **ChatGPT (OpenAI, GPT-6)**. A proposta inicial contém **seis casos gerados com IA**, preservados em [02](02_seis_casos_gerados_ia.md). A análise crítica confrontou entradas, pré-condições, passos e resultados com RF/HU, UML e protótipos e atribuiu decisões **2 MANTER, 4 CORRIGIR** ([03](03_revisao_critica.md)). Na complementação foram incluídos **CT-07** (cancelamento pré-registro) e **CT-08** (repetição da mesma confirmação), inicialmente apoiados por IA e **revisados/mantidos por decisão expressa do integrante em 17/11/2026**. Os oito casos resultantes têm resultados esperados verificáveis e rastreáveis.

**Não se apresenta como geração humana independente aquilo que foi proposto por IA.** A revisão e a aceitação dos complementares são decisões documentadas, distintas de autoria da primeira redação. Tampouco se confundem decisões de revisão **MANTER/CORRIGIR** com resultados de **execução APROVADO/REPROVADO**.

## 5.3 Decisões registradas e justificativas

| Decisão | Razão fundamentada |
|---|---|
| **Uma funcionalidade: registro/encaminhamento pelo chatbot até protocolo.** | Enunciado pede UMA funcionalidade; diagrama de sequência e telas 02–04 descrevem o caminho. |
| **Manter os seis rascunhos iniciais como foram documentados.** | A atividade avalia a **capacidade de criticar** a IA; a versão inicial não deve ser substituída pela corrigida. |
| **Revisar CT-01 e CT-03 como MANTER, com refinamento.** | Cenários são válidos; resultados mais precisos reduzem interpretação subjetiva. |
| **Corrigir CT-02, CT-04, CT-05 e CT-06.** | Remover regras inventadas, medir efetivamente encaminhamento, preservar negações e separar antes/depois de aprovação. |
| **Manter CT-07 e CT-08 como complementares.** | A primeira geração não cobriu desistência nem repetição de confirmação; os dois foram **revisados e mantidos pelo integrante em 17/11/2026**. |
| **Diversificar massas dos cenários.** | Lixo/COMURG em CT-04 e semáforo em CT-06; catálogo demonstrativo existente, sem requisitos novos. |
| **Não apresentar resultados de 17/11/2026 como nova execução.** | O relatório antigo mede entradas e oráculos anteriores; a versão aprimorada **não foi executada**. |
| **Manter código da aplicação e benchmarks independentes inalterados nesta revisão.** | O Checkpoint 3 exige projeto/revisão de casos, não correção do produto nem benchmark. |
| **Entregar PDF independente dos resultados de execução.** | O enunciado pede PDF com seis iniciais, revisão, oito finais, matriz, crítica e ferramenta. |

## 5.4 Pendências de especificação identificadas — sem adicionar RFs

1. **RF002 (completude):** quais informações são indispensáveis por categoria? O requisito não enumera campos e mensagens. Sugestão de melhoria *futura*, **não aplicada**: critérios de aceite para cada modalidade de reclamação.
2. **RF009/RNF007 (correções correlacionadas):** como tratar referências antigas quando um dado de localização é **explicitamente revogado**? A melhoria proposta é explicitar nos critérios de aceitação que campos vigentes devem refletir a correção e distinguir histórico de ficha atual.
3. **RF010/RNF006 (conclusão):** os requisitos já exigem disponibilidade ao órgão; é recomendável documentar um procedimento padrão de verificação de fila/consulta, para não confundir recomendação com encaminhamento.
4. **RF016 (gravidade):** ausentes limiares documentados para decidir classe específica em um relato isolado; não usar “CRITICA” como resultado fixo.
5. **Cancelamento:** ação existe no protótipo, mas texto de confirmação, eliminação da sessão ou retomada não são especificados; não impor essas obrigações.
6. **Critérios de aceitação:** não há uma seção separada de critérios de aceitação para o fluxo escolhido; os oráculos derivam de RF/HU e artefatos verificáveis já presentes.
7. **Divergência de estado inicial na implementação:** foi observada diferença entre status exibido no portal e o exposto por API/banco na execução anterior. Isso é questão a investigar no produto, **não uma nova regra** de aceite destes oito casos.

## 5.5 Reflexão crítica solicitada pela professora

A IA ajudou a propor cenários relevantes e expor caminhos alternativos, mas **alguns resultados pareciam completos justamente porque adicionavam detalhes não autorizados**: mensagem “Endereço obrigatório”, gravidade CRITICA e prazo de 24 horas; exigência de redação idêntica ao relato. O cruzamento com **RF002/RF009/RF010/RF016/RNF007**, diagramas e catálogo permitiu detectar e corrigir esses problemas. A revisão de qualidade não se baseou no número de testes, mas na pergunta **“qual artefato autoriza exatamente este resultado esperado?”**.

A lacuna mais importante era o **encaminhamento**: verificar apenas a sugestão de órgão não satisfaz RF010. Sua versão aprimorada contempla a disponibilidade no destino, sem transformar o atendimento posterior do servidor em nova funcionalidade.

## 5.6 Estado da execução e controle de versão

Em 17/11/2026 foi publicada uma campanha com **7/8 aprovados e CT-03 reprovado** para **casos da versão anterior**: [RELATORIO_FINAL](execucao/RELATORIO_FINAL.md). A versão final descrita neste documento **foi atualizada depois da execução** e **não foi reexecutada**. Em especial, mudaram entradas/oráculos de CT-03, CT-04, CT-05 e CT-06. O percentual antigo **não é** o desempenho da versão nova. O Checkpoint 3 **não exige executar testes**.

## 5.7 Conferência objetiva com o enunciado

- [x] Identificação do projeto, integrantes e uma única funcionalidade.
- [x] Fontes RF/HU, classes, componentes, sequência e protótipos.
- [x] Síntese do comportamento esperado em até cinco linhas (em 01).
- [x] **Seis** casos iniciais preservados (em 02).
- [x] Revisão crítica **individual** dos seis, com MANTER/CORRIGIR e justificativas (em 03).
- [x] **Oito** casos finais, com ID, origem, objetivo, pré-condições, entradas, passos, esperados e fonte (em 04).
- [x] **Dois complementares** distintos e justificados, com decisão do integrante registrada.
- [x] Matriz requisito/critério–teste–cenário–fonte.
- [x] Crítica concreta sobre limitações da IA e melhoria possível de especificação.
- [x] IA utilizada e modo de emprego; reflexão solicitada.
- [ ] Conferência final do texto e apresentação do **PDF** pelos demais integrantes.

**Enunciado:** [Oficina de Teste de Software com IA — Projeto Integrador](https://docs.google.com/document/d/1xD2cu0jp7f6ROX9VbzRxE_ixNVH68iYh/edit).