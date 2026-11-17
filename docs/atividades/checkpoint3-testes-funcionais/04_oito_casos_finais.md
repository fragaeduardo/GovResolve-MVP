# 4. Versão final — oito casos de teste funcionais

**Funcionalidade única:** registro de reclamação pública pelo chatbot até a exibição do protocolo. **Método:** teste de caixa-preta, casos projetados **sem execução**. **Dados:** fictícios. **Origem:** CT-01 a CT-06 são os seis casos gerados com IA e revisados; CT-07 e CT-08 foram **propostos com apoio da IA e posteriormente revisados pelo integrante responsável, que decidiu MANTER ambos em 17/11/2026**. Essa validação é documental; não se atribui autoria exclusivamente humana aos casos.

## CT-01 — Registro confirmado e protocolo único

- **Requisitos/HU:** RF002, RF003, HU002.
- **Origem / revisão:** IA / MANTER.
- **Técnica:** cenário positivo; partição de entrada suficiente.
- **Objetivo:** verificar que uma reclamação aprovada é formalizada com protocolo único, apresentado após confirmação.
- **Pré-condições:** cidadão no portal demonstrativo; nova sessão de reclamação ainda sem registro; serviço disponível.
- **Dados de entrada:** “O bueiro próximo à Rua 10, Setor Central, Goiânia, está danificado e precisa de vistoria e reparo.”; informações complementares fictícias solicitadas durante o atendimento.
- **Passos:**
  1. Abrir o atendimento para nova reclamação.
  2. Informar o relato e complementar o necessário para a proposta.
  3. Conferir a proposta e selecionar **“Confirmar e gerar protocolo”**.
  4. Observar a confirmação e consultar os dados da demanda associada.
- **Resultado esperado:** demanda registrada após confirmação; protocolo identificador **único** exibido ao cidadão e vinculado àquela demanda (RF003); não exigir máscara, prefixo ou comprimento de protocolo não prescritos.
- **Fontes:** especificação RF002/RF003; história HU002; [sequência](../../apresentacao/diagramas/03_sequencia.md); [tela 04](../../apresentacao/telas/04_protocolo.png).
- **Observação:** não testa gov.br oficial nem tempo de salvamento.

## CT-02 — Relato insuficiente antes da formalização

- **Requisitos/HU:** RF002, HU002.
- **Origem / revisão:** IA / CORRIGIR.
- **Técnica:** partição de equivalência negativa; dados insuficientes.
- **Objetivo:** verificar que a coleta não é concluída automaticamente quando faltam informações necessárias.
- **Pré-condições:** cidadão no portal; nova sessão; proposta não aprovada.
- **Dados de entrada:** “Quero reclamar de um problema na rua”, sem descrever qual problema ou atendimento pretende solicitar.
- **Passos:**
  1. Abrir nova reclamação e enviar somente a frase genérica.
  2. Acompanhar a resposta do chatbot.
  3. Sem completar a informação faltante, observar se aparece formalização/protocolo.
- **Resultado esperado:** o fluxo solicita esclarecimentos para coletar a descrição da situação/atendimento e **não conclui o registro nem fornece protocolo** com esse relato insuficiente, conforme verificação de dados de RF002.
- **Fontes:** RF002, HU002; [fluxo de dados faltantes](../../apresentacao/diagramas/04_multiagentes_tools.md) e [sequência](../../apresentacao/diagramas/03_sequencia.md).
- **Limite de especificação:** o RF não enumera quais campos são obrigatórios em cada categoria; por isso não se exige uma frase literal, campo único ou validação numérica.

## CT-03 — Revisão do relato antes da aprovação

- **Requisitos/HU:** RF002, RF009, HU002.
- **Origem / revisão:** IA / MANTER.
- **Técnica:** fluxo alternativo; mudança da entrada.
- **Objetivo:** verificar correção do resumo antes do registro.
- **Pré-condições:** proposta de reclamação exibida e ainda não confirmada.
- **Dados de entrada:** relato inicial com Rua 10; cidadão corrige para Rua 12, mesmo setor; demais fatos inalterados.
- **Passos:**
  1. Obter uma proposta com os dados iniciais.
  2. Acionar **“Não, quero ajustar”** na revisão.
  3. Informar/corrigir o local para Rua 12 no fluxo oferecido.
  4. Verificar a nova versão da proposta sem aprová-la.
- **Resultado esperado:** nova versão da ficha reflete **Rua 12**, sem substituir indevidamente os demais fatos; a demanda ainda **não está formalizada** e não há protocolo antes de confirmação.
- **Fontes:** RF002, RF009; [tela 03](../../apresentacao/telas/03_revisao.png); [sequência (loop)](../../apresentacao/diagramas/03_sequencia.md).

## CT-04 — Classificação e destino conforme catálogo

- **Requisitos/HU:** RF008, RF010, HU008.
- **Origem / revisão:** IA / CORRIGIR.
- **Técnica:** partição por categoria; cenário positivo de triagem.
- **Objetivo:** conferir a categoria e a sugestão de órgão para relato com destino explícito no catálogo demonstrativo.
- **Pré-condições:** nova reclamação suficientemente descrita; catálogo do MVP disponível.
- **Dados de entrada:** “Bueiro quebrado na Rua 10, Setor Central, Goiânia. Solicito reparo.”
- **Passos:**
  1. Conversar e complementar o relato até o chatbot preparar uma proposta.
  2. Conferir a classificação e o órgão sugerido.
  3. Aprovar a proposta e verificar o destino informado no registro.
- **Resultado esperado:** a reclamação é classificada como problema pertinente a **bueiros** e o órgão de referência sugerido/associado é **SEINFRA**, de acordo com o catálogo demonstrativo, sem inventar uma classe textual mais específica.
- **Fontes:** RF008, RF010, HU008; [catálogo de órgãos](../../orgaos-competentes.md); [sequência](../../apresentacao/diagramas/03_sequencia.md).
- **Limite:** a condição adicional de RF010 — ficar disponível à consulta pelo setor — requer evidência da fila do órgão e **não é comprovada apenas por este teste no portal cidadão**. Não marcar “encaminhamento concluído” com base somente na sugestão.

## CT-05 — Preservação dos fatos na proposta

- **Requisitos/HU:** RF009, RNF007, HU007.
- **Origem / revisão:** IA / CORRIGIR.
- **Técnica:** cenário de integridade semântica; comparação de entradas/saídas.
- **Objetivo:** verificar que a organização do texto não inventa fatos nem altera o sentido.
- **Pré-condições:** cidadão inicia reclamação e o chatbot gera proposta para revisão.
- **Dados de entrada:** “O bueiro está danificado. Ninguém ficou ferido. Preciso de vistoria e reparo.” (local fictício complementado se solicitado).
- **Passos:**
  1. Enviar o relato.
  2. Completar somente as informações pedidas, sem afirmar ocorrência de feridos.
  3. Ler o resumo da proposta antes da aprovação.
  4. Comparar os fatos e o sentido com o relato e as complementações dadas.
- **Resultado esperado:** a proposta preserva o problema, a ausência declarada de feridos e a solicitação de reparo, sem acrescentar vítimas, causas, datas ou outros fatos não informados; **não precisa copiar palavras literalmente**.
- **Fontes:** RF009, RNF007, HU007; [tela 03](../../apresentacao/telas/03_revisao.png); [sequência](../../apresentacao/diagramas/03_sequencia.md).

## CT-06 — Gravidade somente depois da aprovação

- **Requisitos/HU:** RF016, HU014.
- **Origem / revisão:** IA / CORRIGIR.
- **Técnica:** tabela de decisão temporal; regra de negócio.
- **Objetivo:** verificar que a classificação formal de gravidade ocorre após aprovação humana e possui justificativa.
- **Pré-condições:** proposta completa apresentada, ainda não aprovada.
- **Dados de entrada:** mesma reclamação de bueiro danificado; sem informar gravidade predefinida.
- **Passos:**
  1. Conduzir conversa até exibição da proposta.
  2. Antes de aprovar, observar se há classificação final de gravidade da demanda.
  3. Aprovar explicitamente a proposta.
  4. Inspecionar o registro confirmado e a gravidade retornada.
- **Resultado esperado:** a classificação **formal** ocorre **após aprovação**, e o registro traz um dos níveis **CRITICA, ALTA, MEDIA, BAIXA**, com justificativa técnica; não impor rótulo predeterminado nem prazo de atendimento sem regra oficial.
- **Fontes:** RF016, HU014; [sequência](../../apresentacao/diagramas/03_sequencia.md); [tela 04](../../apresentacao/telas/04_protocolo.png).
- **Nota:** eventual exibição de informações preliminares não deve ser confundida com classificação formal pós-aprovação.

## CT-07 — Cancelar proposta antes de registrar (complementar)

- **Requisitos/HU:** RF002, RF003, HU002; ação explícita no protótipo.
- **Origem / revisão:** complementação proposta com apoio de IA / **MANTER** (revisão do integrante em 17/11/2026).
- **Técnica:** cenário alternativo negativo; ramo **cancelar** versus **aprovar**.
- **Justificativa:** os seis casos da IA tratavam aprovação e correção, mas **não a saída por cancelamento** mostrada na interface.
- **Objetivo:** verificar ausência de formalização quando o cidadão desiste antes da aprovação.
- **Pré-condições:** proposta de reclamação exibida e ainda não aprovada.
- **Dados de entrada:** relato fictício de bueiro danificado, suficiente para a proposta; opção **Cancelar esta solicitação antes da autuação**.
- **Passos:**
  1. Enviar relato e obter proposta.
  2. Acionar o botão de cancelamento anterior à autuação (ícone X).
  3. Conferir que o fluxo não apresenta uma confirmação de registro da proposta cancelada.
- **Resultado esperado:** a proposta cancelada **não é formalizada** e **não recebe protocolo**, pois o registro exige confirmação do cidadão no fluxo documentado.
- **Fontes:** [ProposalCard (botão Cancelar)](https://github.com/fragaeduardo/GovResolve-MVP/blob/main/frontend/src/components/chat/ProposalCard.tsx), RF002/RF003; [sequência](../../apresentacao/diagramas/03_sequencia.md).
- **Pendência delimitada:** mensagem específica, limpeza de sessão e possibilidade de retomar a proposta não estão definidas e não são exigidas por este caso.

## CT-08 — Repetir confirmação da mesma proposta (complementar)

- **Requisitos/HU:** RF003, HU002; comportamento de idempotência descrito no diagrama de sequência.
- **Origem / revisão:** complementação proposta com apoio de IA / **MANTER** (revisão do integrante em 17/11/2026).
- **Técnica:** caso negativo por duplicidade; mesmo estado/mesma proposta.
- **Justificativa:** complementa a geração de protocolo ao tratar confirmação enviada duas vezes na **mesma sessão e versão de proposta**.
- **Objetivo:** verificar que a confirmação repetida da mesma proposta não cria outro protocolo ou outra demanda.
- **Pré-condições:** cidadão possui proposta completa e aprovada, com sessão e versão identificáveis; a primeira confirmação foi processada e possui protocolo.
- **Dados de entrada:** duas confirmações da mesma proposta, com a **mesma sessão, cidadão e versão**, sem alterar seus dados.
- **Passos:**
  1. Confirmar uma proposta no fluxo do portal e registrar o protocolo devolvido.
  2. Reenviar **a mesma confirmação** com os mesmos identificadores (p. ex., repetição da requisição ao endpoint de confirmação, no ambiente de testes).
  3. Comparar protocolo e demanda retornados nas duas confirmações.
- **Resultado esperado:** ambas as confirmações se referem ao **mesmo protocolo e à mesma demanda**, sem segundo cadastro. Não impor códigos HTTP específicos.
- **Fontes:** RF003, HU002; [diagrama de sequência — confirmação duplicada por sessão](../../apresentacao/diagramas/03_sequencia.md); [diagrama de classes — unicidade por sessão](../../apresentacao/diagramas/01_classes.md).
- **Restrição:** este caso trata apenas da **mesma** sessão/versão. Não generalizar a proibição de registrar duas reclamações distintas do mesmo cidadão.

---

## Quadro de composição

| Gerados inicialmente com IA | Revisão | Complementares revisados e mantidos |
|---|---|---|
| CT-01, CT-03 | MANTER | CT-07 — cancelar proposta antes do registro |
| CT-02, CT-04, CT-05, CT-06 | CORRIGIR | CT-08 — repetição de confirmação |
| **Total inicial: 6** | **Versão final: 6 revisados + 2 complementares** | **Total final: 8** |

Nenhum caso recebe resultado **aprovado/reprovado**, porque **não houve execução**. Os complementares **CT-07 e CT-08 foram revisados e mantidos pelo integrante** em 17/11/2026; ainda cabe conferência do documento final pelos demais integrantes antes da apresentação.