# 4. Versão final aprimorada — oito casos de teste funcionais

**Projeto:** GovResolve-MVP · **Checkpoint 3 — Oficina de Teste de Software com IA**  
**Funcionalidade única:** registrar uma reclamação pelo chatbot, incluindo proposta, revisão, confirmação, encaminhamento e protocolo. A leitura pontual da fila do órgão em CT-04 serve **somente** para verificar a conclusão desse registro; não testa tratamento posterior.  
**Natureza:** especificação de testes funcionais de **caixa-preta**. **Esta versão foi aprimorada em 17/11/2026 e ainda não foi executada.** A campanha já publicada em [execucao/](execucao/) testou a **versão anterior** e deve permanecer como histórico, sem transportar automaticamente seus vereditos.  
**Origem e revisão:** CT-01 a CT-06 = IA e revisão crítica da equipe (MANTER CT-01/CT-03; CORRIGIR CT-02/04/05/06). CT-07 e CT-08 = propostas complementares com apoio de IA, **revisadas e mantidas pelo integrante em 17/11/2026**. O aperfeiçoamento de redação/oráculos **não constitui criação de requisitos**.

## Convenções de qualidade e verificação

- **Entrada:** frases e locais fictícios são *massa de teste*, não campos obrigatórios nem fatos reais sobre Goiânia.
- **Identificação:** usar uma nova sessão para cada caso; quando houver registro, comparar o **mesmo identificador de protocolo** nas telas/consultas da **mesma demanda**. Não exigir formato textual de protocolo.
- **Oráculo:** cada resultado esperado está dividido em critérios **E1, E2...**, ligados às fontes. Um caso é atendido quando **todos** seus critérios aplicáveis forem observados; caso contrário, indicar o critério não atendido ou a falta de evidência. Não chamar de aprovado sem executar.
- **Evidências sugeridas:** captura da proposta e da confirmação; consulta funcional por protocolo; consulta de leitura da demanda/fila pelo perfil permitido. Evidências técnicas podem reforçar, mas **não substituir**, comportamentos de caixa-preta.
- **Não especificado:** sem impor códigos HTTP, mensagens exatas não documentadas, comprimentos de campos, gravidade fixa, SLA ou proibição de duas reclamações distintas. O gov.br real é futuro; usar o perfil acadêmico.

---

## CT-01 — Registro confirmado com protocolo único

**Vínculo:** RF002, RF003 e HU002. **Origem/decisão:** IA / **MANTER** (refinado).  
**Técnica:** classe de equivalência positiva; jornada de registro.  
**Objetivo:** verificar que uma reclamação suficientemente descrita é registrada **após confirmação** e identificada por protocolo único.

**Pré-condições:** cidadão no portal de demonstração; nova sessão sem demanda registrada; dados de outras demandas/protocolos disponíveis para comparação, quando houver.

**Dados fictícios:** “O bueiro da Rua 10, Setor Central, está danificado. Solicito vistoria e reparo.” Responder com dados fictícios apenas se forem solicitados durante a coleta.

**Passos**
1. Iniciar uma reclamação no chatbot e fornecer a entrada.
2. Complementar o relato se o sistema solicitar; aguardar a proposta para revisão.
3. Antes de aprovar, observar se já foi emitido um **protocolo de registro**.
4. Aprovar usando a ação existente **“Confirmar e gerar protocolo”**.
5. Conferir a confirmação, identificar o protocolo e consultar a demanda relacionada a ele.

**Resultado esperado / oráculo**
- **E1 (RF002, sequência):** a proposta é apresentada para revisão; **não há registro/protocolo de demanda antes da aprovação**.
- **E2 (RF002/RF003):** depois da aprovação, a reclamação é registrada e o cidadão recebe um protocolo.
- **E3 (RF003):** o protocolo consultado identifica **a mesma demanda**, com os fatos essenciais do relato; não aponta para outro registro.
- **E4 (RF003):** esse protocolo **não se repete em outra demanda** no conjunto observado. A verificação usa os registros acessíveis no ambiente de teste e não presume demonstração exaustiva sobre dados inacessíveis.

**Fonte de origem:** [RF002/RF003/HU002](../../especificacao-requisitos.md); [diagrama de sequência](../../apresentacao/diagramas/03_sequencia.md); [tela 04](../../apresentacao/telas/04_protocolo.png).  
**Fora do escopo:** formato/máscara de protocolo, autenticação gov.br real, tempo de resposta e duplicidade da **mesma** confirmação (CT-08).

---

## CT-02 — Informações insuficientes bloqueiam a formalização

**Vínculo:** RF002 e HU002. **Origem/decisão:** IA / **CORRIGIR**.  
**Técnica:** partição de equivalência negativa (relato sem descrição do problema e sem pedido de atendimento).  
**Objetivo:** verificar que uma reclamação incompleta não é registrada como se estivesse pronta.

**Pré-condições:** nova sessão do cidadão, sem proposta confirmada nem demanda vinculada.

**Dados fictícios:** entrada única **“Quero reclamar de um problema na rua.”** Não fornecer qual problema ocorreu nem qual atendimento é solicitado.

**Passos**
1. Abrir uma reclamação e enviar **somente** o texto acima.
2. Acompanhar a resposta do chatbot; não oferecer complementos.
3. Verificar se foi apresentada uma ficha pronta para aprovação e se houve formalização/protocolo.

**Resultado esperado / oráculo**
- **E1 (RF002):** o atendimento solicita informações para definir a situação e/ou o serviço demandado; não toma a frase genérica como descrição suficiente.
- **E2 (RF002, fluxo UML):** enquanto a falta de informações essenciais persistir, o fluxo **permanece em coleta** e não registra a reclamação.
- **E3 (RF003, sequência):** não é gerado protocolo de **registro** sem aprovação/formalização.

**Fonte de origem:** [RF002/HU002](../../especificacao-requisitos.md); [fluxo de coleta de dados faltantes](../../apresentacao/diagramas/04_multiagentes_tools.md); [tela 02](../../apresentacao/telas/02_conversa.png).  
**Pendência de especificação:** RF002 **não define uma lista universal de campos obrigatórios**; portanto, este teste se baseia na ausência explícita da **descrição da situação e do atendimento solicitado**, não em “endereço obrigatório”, comprimento mínimo ou frase de erro.

---

## CT-03 — Correção coerente da proposta, sem registro antecipado

**Vínculo:** RF002, RF009, RNF007 e HU002. **Origem/decisão:** IA / **MANTER**, com refinamento para tornar a correção inequívoca.  
**Técnica:** fluxo alternativo de revisão; transição de estado; integridade dos dados.  
**Objetivo:** verificar que uma informação **declaradamente errada** é substituída na ficha corrente, mantendo os fatos válidos.

**Pré-condições:** proposta v1 exibida, não aprovada; com localização corrente “Rua 10”, referência corrente “próximo à Rua 10”, bairro “Setor Central”, problema “bueiro danificado” e solicitação “vistoria e reparo”.

**Dados fictícios — correção inequívoca:** **“Corrija o endereço para Rua 12, Setor Central. A Rua 10 e a referência ‘próximo à Rua 10’ estavam erradas e não devem constar como localização ou referência atuais. Mantenha o problema do bueiro e o pedido de vistoria e reparo.”**

**Passos**
1. Conferir/capturar os dados correntes da proposta v1, sem confirmar.
2. Selecionar **“Não, quero ajustar”** e enviar a correção completa acima.
3. Aguardar a nova proposta v2 e comparar **endereço, referência atual, título e descrição factual** com a instrução.
4. Verificar que os demais fatos permanecem e **não** acionar aprovação.
5. Conferir que não houve registro ou protocolo para essa sessão.

**Resultado esperado / oráculo**
- **E1 (RF009/RNF007, sequência):** a proposta revista apresenta **Rua 12** como localização atual e **não apresenta Rua 10 como referência/localização vigente**, salvo se claramente identificada como informação histórica **substituída**.
- **E2 (RF009/RNF007):** problema, setor e pedido de vistoria/reparo permanecem corretos; nenhum fato novo é acrescentado sem origem no relato/correção.
- **E3 (sequência/protótipo):** a ação de revisar retorna uma proposta atualizada para apreciação do cidadão, sem registrar automaticamente.
- **E4 (RF002/RF003, sequência):** antes da aprovação explícita, não há demanda formalizada nem protocolo de registro nessa sessão.

**Fonte de origem:** [RF002/RF009/RNF007/HU002](../../especificacao-requisitos.md); [loop de revisão do diagrama 03](../../apresentacao/diagramas/03_sequencia.md); [tela 03](../../apresentacao/telas/03_revisao.png).  
**Limite:** é legítimo manter o **histórico da conversa**; o erro seria exibir uma informação **revogada** como se ainda fosse atual. A versão anterior, executada em 17/11/2026, permanece documentada em [CT-03/relatorio.md](execucao/CT-03/relatorio.md) e **não representa execução deste novo texto**.

---

## CT-04 — Classificação e encaminhamento efetivo ao setor competente

**Vínculo:** RF008, RF010 e HU008; RF011 como **fonte de observação da disponibilidade na fila**, sem testar o processo de tratamento. **Origem/decisão:** IA / **CORRIGIR**.  
**Técnica:** classe positiva de triagem por categoria; integração funcional de ponta a ponta do **registro e encaminhamento**.  
**Objetivo:** comprovar a categoria/órgão sugerido e, principalmente, o critério de conclusão do encaminhamento descrito em RF010.

**Pré-condições:** cidadão e servidor demonstrativo **vinculado à COMURG** acessíveis; catálogo de órgãos do MVP configurado; nova sessão sem demanda anterior.

**Dados fictícios:** **“Há lixo acumulado na Rua 20, Setor Oeste, Goiânia, após ausência de coleta. Solicito limpeza e recolhimento.”**

**Passos**
1. Registrar o relato pelo chatbot e complementar somente se solicitado.
2. Antes de confirmar, verificar categoria de atendimento e **órgão de destino sugerido** na proposta.
3. Aprovar a proposta e anotar o **protocolo** da reclamação registrada.
4. Acessar **a consulta de demandas do servidor vinculado à COMURG**, somente para leitura.
5. Procurar o **mesmo protocolo** e conferir conteúdo essencial e vínculo de órgão.

**Resultado esperado / oráculo**
- **E1 (RF008, catálogo):** a classificação é compatível com **limpeza/lixo**; não impor uma **string** específica para a categoria.
- **E2 (RF010, catálogo):** o destino sugerido/associado é **COMURG**, organização indicada no catálogo demonstrativo para limpeza de ruas/lixo.
- **E3 (RF003):** a confirmação registra a reclamação e fornece protocolo que identifica o mesmo atendimento.
- **E4 (RF010/RF011):** a demanda desse protocolo fica **efetivamente disponível para consulta pelo servidor vinculado ao órgão COMURG**. **Só então** considerar concluído o encaminhamento.
- **E5 (RNF006):** se a aplicação **indicar encaminhamento concluído**, o mesmo protocolo **já deve estar disponível** ao setor destinatário; não considerar a mera sugestão como comprovação da conclusão.

**Fonte de origem:** [RF008/RF010/RF011/RNF006/HU008](../../especificacao-requisitos.md); [catálogo — COMURG](../../orgaos-competentes.md); [componentes](../../apresentacao/diagramas/02_componentes.md); [sequência](../../apresentacao/diagramas/03_sequencia.md); [tela de servidor 06](../../apresentacao/telas/06_servidor.png).  
**Delimitação:** a **consulta read-only** na fila é a evidência de saída do **encaminhamento da demanda**; atualizar status, responder ou concluir o atendimento do servidor **não** faz parte deste caso. A execução histórica do CT-04 com **bueiro/SEINFRA** não deve ser usada como resultado da nova massa **lixo/COMURG**.

---

## CT-05 — Fidelidade semântica e ausência de fatos inventados

**Vínculo:** RF009, RNF007 e HU007. **Origem/decisão:** IA / **CORRIGIR**.  
**Técnica:** equivalência semântica entre entrada e saída; matriz de afirmações verificáveis.  
**Objetivo:** verificar se a IA reorganiza o relato **sem alterar afirmações, negações ou incertezas**.

**Pré-condições:** cidadão em nova reclamação; proposta ainda não aprovada.

**Dados fictícios:** **“Um bueiro está danificado na Rua 10, Setor Central. Ninguém ficou ferido. Não sei o que causou o problema. Solicito vistoria e reparo.”** Complementos, quando pedidos, serão registrados e considerados **fontes adicionais**, não invenções.

**Passos**
1. Enviar a entrada e fornecer apenas complementos fictícios expressamente registrados.
2. Obter a proposta do chatbot antes da aprovação.
3. Conferir a descrição organizada, título e campos estruturados contra a **matriz abaixo**, considerando também os complementos fornecidos.
4. Não confirmar a proposta; registrar quais afirmações foram preservadas, distorcidas ou acrescentadas sem fonte.

**Resultado esperado / oráculo — matriz de fatos (RF009/RNF007)**

| ID | Informação da entrada | Critério verificável |
|---|---|---|
| F1 | Bueiro danificado | O problema permanece reconhecível na proposta. |
| F2 | Local: Rua 10 / Setor Central | O local é preservado, se não for corrigido pelo cidadão. |
| F3 | **Ninguém ficou ferido** | A **negação** é mantida; não afirmar que houve feridos. |
| F4 | **Causa desconhecida** | Preservar a incerteza; **não atribuir uma causa**. |
| F5 | **Solicita vistoria e reparo** | O objetivo do atendimento é mantido. |
| F6 | Ausência de outros fatos informados | Não acrescentar vítimas, datas, eventos, danos ou conclusões não sustentados. |

**Critério de decisão:** o caso satisfaz o oráculo somente se **F1–F6** forem atendidos; reformulação de vocabulário e acréscimo de dados **realmente fornecidos** pelo cidadão não são falha. Anotar, em caso de divergência, a **expressão concreta** da proposta e a afirmação original conflitante.

**Fonte de origem:** [RF009/RNF007/HU007](../../especificacao-requisitos.md); [diagrama 03](../../apresentacao/diagramas/03_sequencia.md); [tela de revisão 03](../../apresentacao/telas/03_revisao.png).  
**Limite:** não medir acurácia geral de modelos a partir de um caso. **Não** exigir cópia literal das mensagens.

---

## CT-06 — Gravidade formal somente após aprovação explícita

**Vínculo:** RF016 e HU014. **Origem/decisão:** IA / **CORRIGIR**.  
**Técnica:** tabela de decisão temporal (antes/depois da aprovação); regra de negócio.  
**Objetivo:** verificar **ordem de formalização** e conteúdo da classificação, sem predeterminar gravidade.

**Pré-condições:** cidadão no portal, proposta pronta **não aprovada**; nenhuma demanda vinculada à nova sessão.

**Dados fictícios:** **“Um semáforo está sem funcionar no cruzamento da Rua 30 com a Rua 40, Setor Sul. Solicito verificação e manutenção.”** Os nomes de vias são apenas massa de teste; **não** se estabelece uma categoria ou nível de gravidade obrigatório por essa frase.

**Passos**
1. Iniciar reclamação, completar a ficha se solicitado e chegar à proposta.
2. **Antes do clique de aprovação**, verificar a proposta e a ausência de demanda/protocolo **formalizados** na sessão.
3. Confirmar explicitamente a proposta.
4. Conferir a resposta de confirmação e o registro associado ao protocolo, verificando gravidade e justificativa.
5. Se houver evidência externa de sequência de chamadas/eventos, utilizá-la **apenas como suporte** para verificar a ordem; não inferir o instante de uma ação interna só pela tela.

**Resultado esperado / oráculo**
- **E1 (RF016/diagrama):** antes da aprovação, não há classificação **formal vinculada a demanda registrada**; uma indicação expressamente provisória, se exibida, não equivale ao resultado final.
- **E2 (RF016):** depois da aprovação, o registro exibe **um dos quatro níveis**: CRITICA, ALTA, MEDIA ou BAIXA.
- **E3 (RF016/HU014):** há **parecer justificativo** contextual; se o sistema indicar uma classificação provisória, essa condição deve ser identificada conforme HU014.
- **E4 (RF016):** não é anunciado prazo sem regra oficial cadastrada para o órgão.

**Fonte de origem:** [RF016/HU014](../../especificacao-requisitos.md); [diagrama de sequência — formalização e classificação](../../apresentacao/diagramas/03_sequencia.md); [tela 04](../../apresentacao/telas/04_protocolo.png).  
**Pendência:** não há limiares quantitativos documentados para fixar uma classe para o cenário. A exibição de um nível e sua justificativa **não prova** que a classe escolhida é ótima; este teste verifica o **contrato funcional**.

---

## CT-07 — Cancelamento da proposta antes do registro (complementar)

**Vínculo:** RF002, RF003, HU002; ação explícita no protótipo. **Origem/decisão:** complemento apoiado por IA, **MANTER** (decisão confirmada pelo integrante em 17/11/2026).  
**Técnica:** fluxo alternativo negativo (cancelar × confirmar).  
**Justificativa de inclusão:** os seis casos iniciais cobrem aprovação e ajustes, mas não **desistência antes da autuação**.

**Pré-condições:** proposta completa de reclamação exibida, ainda não aprovada e não formalizada.

**Dados fictícios:** reclamação de bueiro danificado; ação visível **“Cancelar esta solicitação antes da autuação”** (ícone X).

**Passos**
1. Relatar o problema e chegar ao cartão de proposta.
2. **Sem clicar em confirmar**, acionar a opção de cancelar a proposta.
3. Observar o estado final do atendimento e conferir ausência de protocolo/demanda da proposta cancelada.

**Resultado esperado / oráculo**
- **E1 (protótipo):** a ação de cancelamento é oferecida antes da confirmação e permite desistir da proposta.
- **E2 (RF002/RF003, sequência):** essa proposta **não é registrada** após cancelar; **não recebe protocolo**.
- **E3 (RF003):** nenhuma mensagem de sucesso de **demanda registrada** é apresentada para essa proposta cancelada.

**Fonte de origem:** [RF002/RF003/HU002](../../especificacao-requisitos.md); [botão de cancelamento do protótipo](https://github.com/fragaeduardo/GovResolve-MVP/blob/main/frontend/src/components/chat/ProposalCard.tsx); [diagrama de sequência](../../apresentacao/diagramas/03_sequencia.md).  
**Não especificado:** texto literal de cancelamento, limpeza física da sessão, retomada e retenção do histórico. Não são critérios deste caso.

---

## CT-08 — Repetição da confirmação da mesma proposta (complementar)

**Vínculo:** RF003, HU002 e regra de idempotência **já descrita** nos diagramas. **Origem/decisão:** complemento apoiado por IA, **MANTER** (decisão confirmada pelo integrante em 17/11/2026).  
**Técnica:** cenário negativo de duplicidade; partição “mesma sessão/versão/cidadão” após registro.  
**Justificativa de inclusão:** CT-01 avalia o registro normal, mas não a **repetição** da mesma confirmação depois de uma resposta bem-sucedida.

**Pré-condições:** cidadão com proposta completa ainda não confirmada; identificadores da sessão e da versão conhecidos para reproduzir **a mesma confirmação** no ambiente de teste.

**Dados fictícios:** relato de bueiro danificado; **duas confirmações sequenciais do mesmo cidadão, sessão e versão, com os mesmos dados**.

**Passos**
1. Confirmar uma única vez a proposta pela interface e guardar protocolo/dados da demanda.
2. **Somente depois do término da primeira resposta**, repetir a confirmação com **a mesma** sessão, proposta, versão, cidadão e conteúdo (por meio do contrato de confirmação, quando a interface já tiver concluído).
3. Comparar os identificadores devolvidos e consultar as demandas da sessão para verificar se apareceu um segundo registro.

**Resultado esperado / oráculo**
- **E1 (RF003, sequência):** ambas as confirmações remetem ao **mesmo protocolo**.
- **E2 (RF003, classes/sequência):** ambas se referem à **mesma demanda**, sem segundo cadastro ou novo protocolo para essa mesma sessão.
- **E3 (diagrama de sequência):** a confirmação repetida não reinicia um **novo atendimento** nem cria outro histórico inicial de registro para a mesma demanda.

**Fonte de origem:** [RF003/HU002](../../especificacao-requisitos.md); [sequência — repetição por sessão](../../apresentacao/diagramas/03_sequencia.md); [classes — unicidade por sessão](../../apresentacao/diagramas/01_classes.md).  
**Fora do escopo:** duas reclamações **diferentes** do mesmo cidadão, requisições **concorrentes**, outras versões de proposta e códigos HTTP específicos.

---

## Cobertura e rastreabilidade resumidas

| Caso | Classe/caminho | Comportamento principal | RF/HU principais | Decisão de revisão |
|---|---|---|---|---|
| CT-01 | Positivo | Registro confirmado e protocolo único | RF002, RF003, HU002 | IA: MANTER |
| CT-02 | Negativo | Relato semanticamente insuficiente | RF002, HU002 | IA: CORRIGIR |
| CT-03 | Alternativo | Correção de informação revogada | RF002, RF009, RNF007 | IA: MANTER + refinamento |
| CT-04 | Positivo/integração | Classificação e **disponibilidade efetiva** no destino | RF008, RF010, HU008 | IA: CORRIGIR |
| CT-05 | Integridade | Preservação de fatos, negação e incerteza | RF009, RNF007 | IA: CORRIGIR |
| CT-06 | Temporal | Gravidade formal pós-aprovação | RF016, HU014 | IA: CORRIGIR |
| CT-07 | Alternativo negativo | Cancelamento antes do registro | RF002, RF003 | Complementar: MANTER |
| CT-08 | Negativo por repetição | Idempotência da mesma confirmação | RF003, HU002 | Complementar: MANTER |

**Atenção à versão:** a execução de 17/11/2026 (7 aprovados, 1 reprovado) permanece documentada em [execucao/RELATORIO_FINAL.md](execucao/RELATORIO_FINAL.md), **referente aos casos anteriores a esta revisão**. A alteração de entradas e oráculos em CT-03/04/05/06 requer **nova execução** se alguém quiser atribuir vereditos a esta versão. O Checkpoint 3 **não exige execução**.