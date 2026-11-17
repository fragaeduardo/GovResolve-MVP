# 3. Revisão crítica dos seis casos gerados com IA

**Procedimento:** confronto de cada entrada, pré-condição, passo e resultado esperado com a especificação de requisitos, as histórias, os diagramas UML, o catálogo de destinos e as telas. Os casos **não foram executados**. A decisão **CORRIGIR** substitui o resultado esperado não sustentado por um comportamento documentado. Todos os casos mantêm seus IDs.

| Caso | Decisão | O que a IA acertou | Crítica concreta e correção necessária | Evidência |
|---|---|---|---|---|
| CT-01 | **MANTER** | Cobriu a jornada completa de confirmação e protocolo. | Explicitar que o número deve ser único e só surgir após confirmação; não supor formato do protocolo. | RF002, RF003, HU002; diagrama 03; tela 04. |
| CT-02 | **CORRIGIR** | Percebeu que há validação de completude antes de registrar. | Inventou que endereço é obrigatório em **toda** demanda e uma mensagem textual exata. Usar uma descrição **manifestamente incompleta**, exigir solicitação de informações e ausência de formalização, sem predeterminar campo/mensagem. | RF002; diagrama 04 (loop de dados faltantes); tela 02. |
| CT-03 | **MANTER** | Testou o fluxo alternativo de correção pré-aprovação. | Afirmar que nova proposta deve refletir a correção, sem inventar obrigatoriedade de um formato de endereço. | RF009; diagrama 03 (loop), tela 03; RF002. |
| CT-04 | **CORRIGIR** | Combinou classificação e destino com um exemplo do catálogo. | Separar **órgão sugerido** na proposta do **encaminhamento concluído**. A disponibilidade real à fila do setor, exigida por RF010, não é observável apenas nas telas deste recorte; documentar esse limite. | RF008, RF010; catálogo (bueiros → SEINFRA); diagrama 02/03. |
| CT-05 | **CORRIGIR** | Identificou a necessidade de conferir a fidelidade do resumo. | Inventou identidade literal de palavras. RF009 e RNF007 exigem **mesmos fatos e sentido**, sem acréscimos ou distorção — o texto pode ser reescrito. | RF009, RNF007, HU007; diagramas de componentes e sequência. |
| CT-06 | **CORRIGIR** | Incluiu classificação de gravidade após a aprovação. | Inventou obrigatoriedade de gravidade CRITICA e prazo de 24h. Verificar **momento** após aprovação, pertencimento aos quatro níveis e justificativa; não criar SLA nem classe fixa para um relato. | RF016, HU014; diagrama 03; tela 04. |

## 3.1 O que foi efetivamente revisado

- **Pré-condições:** acesso por perfil demonstrativo de cidadão e cenário anterior ao registro; não pressupor integração gov.br real nem dados pessoais.
- **Entradas:** exemplos fictícios e contextualizados; nenhum limite numérico novo de tamanho ou escala.
- **Passos:** respeitam conversa → proposta/revisão → aprovação → formalização → protocolo, com loops apenas onde diagramas/telas os mostram.
- **Resultados esperados:** baseados em exigências documentadas; nenhum código HTTP, frase de alerta ou tempo de resposta foi inventado.
- **Escopo:** somente registro via chatbot; não confundir a sugestão de órgão com garantia de processamento pelo servidor.

## 3.2 Crítica à IA — exigida pelo enunciado

A geração automática formulou resultados *aparentemente testáveis*, mas parte deles não era justificável: CT-02 inventou uma mensagem e um campo universalmente obrigatório; CT-05 confundiu preservação de fatos com cópia literal; CT-06 criou uma gravidade fixa e um prazo não oficial. A revisão cruzada com **RF002, RF009, RF016, RNF007 e diagramas** foi decisiva para detectar essas extrapolações.

## 3.3 Dúvidas e melhorias de especificação

1. **RF002 não enumera, por tipo de reclamação, os dados obrigatórios.** Isso impede especificar exatamente quais omissões devem gerar bloqueio; convém detalhar a lista em uma futura revisão de requisitos (não alterada nesta atividade).
2. **RF010 distingue encaminhamento sugerido e concluído.** Recomendável explicitar nos critérios de aceitação como comprovar a disponibilização ao setor destinatário, sobretudo na integração entre o chat e a fila.
3. **Status inicial:** a documentação do fluxo usa ABERTO; um caminho direto da API pode se comportar de modo distinto. Como a atividade só trata do cadastro conversacional, registrar a divergência para conferência, sem reescrever a regra.
4. **RF016:** não há limiar numérico documentado para atribuição de gravidade; o teste deve avaliar o *contrato de saída*, não impor um rótulo por intuição.
5. **Critérios de aceitação específicos:** não se localizou uma seção formal separada de critérios de aceitação para a funcionalidade escolhida. São usados os RFs/HUs e comportamentos explícitos de UML/protótipos.

**Síntese:** a revisão não “aprova” a IA por produzir seis casos; **quatro dos seis casos precisaram ser corrigidos**. Essas classificações são avaliações documentais, não resultados de execução do GovResolve.