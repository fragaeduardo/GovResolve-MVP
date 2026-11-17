# CT-10 — Registro destinado à revisão humana da Ouvidoria por solicitação explícita

**Tipo:** teste extra, opcional, de caixa-preta. **Origem:** proposta com IA. **Revisão pelo grupo:** pendente. **Execução:** NÃO EXECUTADO. Não integra os oito testes finais obrigatórios do Checkpoint 3.

## 1. Identificação

| Elemento | Definição |
|---|---|
| **Objetivo** | Verificar que uma reclamação com **pedido explícito de análise humana pela Ouvidoria** pode ser confirmada, receber protocolo e ficar disponível na **fila de revisão do gestor**, sem atribuir artificialmente órgão destinatário. |
| **RF/HU relacionados** | RF002 e HU002 (registro de reclamação), RF003 (protocolo após confirmação), RF008 e RF010/HU008 (triagem e destino da demanda). |
| **Regra específica previamente documentada** | [Catálogo — Casos não classificados](../../../orgaos-competentes.md): o cidadão pode pedir “encaminhar para ouvidoria”; a demanda recebe protocolo, **não possui órgão definitivo** e aparece em **Revisão da Ouvidoria**, acessível ao **gestor**. A Ouvidoria é **fila**, não décimo terceiro órgão. |
| **Fluxo de apoio** | [Diagrama multiagente 04](../../../apresentacao/diagramas/04_multiagentes_tools.md): pedido explícito de análise humana como exceção do fluxo principal. |
| **Implementação consultada somente para coerência** | [Planner: HUMAN_REVIEW](https://github.com/fragaeduardo/GovResolve-MVP/blob/main/src/ai/agents/planner.py); [FormalizationAgent](https://github.com/fragaeduardo/GovResolve-MVP/blob/main/src/ai/agents/formalization_agent.py); [fila do gestor](https://github.com/fragaeduardo/GovResolve-MVP/blob/main/src/api/routes/admin.py). |
| **Técnica** | Fluxo alternativo de exceção; partição **órgão identificado × revisão humana explicitamente solicitada**; verificação de integração entre portal, registro e fila de revisão. |

**Atenção:** a fonte documental **não determina** encaminhamento automático à Ouvidoria em toda classificação incerta. O gatilho inequívoco deste teste é **o pedido explícito do cidadão**; não se inventa limiar de confiança ou número máximo de perguntas.

## 2. Pré-condições

1. Ambiente isolado com catálogo demonstrativo, portal e APIs disponíveis; perfis de **cidadão** e **gestor** autorizados em contas fictícias.
2. Nova sessão de reclamação **sem demanda prévia**. Nenhum gestor atribuiu órgão para essa sessão.
3. Fila **Revisão da Ouvidoria** disponível para **consulta somente-leitura** pelo perfil gestor. A existência de casos anteriores na fila não interfere: o teste deve procurar o **protocolo recém-gerado**.
4. Não utilizar identidade gov.br real, dados pessoais nem órgãos externos inventados.

## 3. Massa de teste e entrada completa

**Relato fictício (usar integralmente):**

> “Quero registrar uma reclamação sobre a entrada de um prédio público municipal no Setor Central, Goiânia. Parte do acesso está bloqueada por materiais e solicito avaliação e desobstrução. **Não sei qual órgão municipal deve atender e peço expressamente que esta reclamação seja encaminhada à Ouvidoria para análise humana do destino.**”

**Complementos:** responder apenas informações fictícias solicitadas pela aplicação, sem retirar o pedido expresso de Ouvidoria nem escolher arbitrariamente um órgão. Se a aplicação fizer perguntas para completar a descrição, continuar na mesma sessão.

**Por que essa massa?** O cidadão descreve **um problema e o atendimento solicitado** — não é o CT-02 de relato vazio. A saída excepcional é motivada pelo **pedido de revisão humana**, não pelo testador presumir que o modelo ficou incerto.

## 4. Passos reproduzíveis

1. Como cidadão demonstrativo, iniciar uma sessão nova e enviar o texto acima, incluindo o pedido de encaminhamento à Ouvidoria.
2. Se o chatbot solicitar complementos, responder de forma fictícia preservando o pedido explícito. Aguardar uma proposta revisável; registrar o texto e o destino indicado.
3. **Antes de confirmar**, conferir que não há demanda formalizada nem protocolo vinculado à sessão.
4. Aprovar a proposta usando a ação de confirmação do portal. Guardar o **protocolo realmente gerado** e verificar a descrição registrada.
5. Como **gestor de demonstração**, abrir a fila de revisão da Ouvidoria e localizar **esse mesmo protocolo**, conferindo o conteúdo essencial.
6. Conferir que a demanda continua **sem órgão municipal definitivo atribuído**, disponível à análise humana. **Não executar atribuição de órgão**, atualização de status ou tratamento da reclamação.
7. Registrar evidências da proposta, da confirmação e da consulta de leitura do gestor; encerrar o teste.

## 5. Resultados esperados (oráculos)

| ID | Critério objetivo | Como observar |
|---|---|---|
| **O1 — Intenção humana** | O pedido explícito de **Ouvidoria/análise humana** é respeitado; o chatbot não substitui silenciosamente a intenção por um órgão definitivo inferido. | Proposta de atendimento, destino indicado e resposta da conversa. |
| **O2 — Fidelidade e aprovação** | A proposta preserva o acesso bloqueado e a solicitação de avaliação/desobstrução; **não há protocolo de registro antes da aprovação**. | Comparação entre relato, proposta e estado pré-confirmação. |
| **O3 — Registro efetivo** | Após a confirmação, há **uma demanda registrada e um protocolo** que identifica a mesma reclamação, mesmo sem órgão definitivo. | Confirmação e consulta por protocolo. |
| **O4 — Sem atribuição artificial** | A reclamação **não recebe automaticamente um dos 12 órgãos municipais** como destino definitivo; está **aguardando revisão humana**. | Dados funcionais do registro e lista do gestor. |
| **O5 — Disponibilidade ao responsável** | O **mesmo protocolo** está presente na fila **Revisão da Ouvidoria**, consultável pelo **gestor**. | Busca/consulta somente-leitura da fila com o protocolo. |
| **O6 — Fluxo de exceção correto** | A Ouvidoria é tratada como **fila para decisão humana**, não como novo órgão da lista do catálogo; o caso termina antes da atribuição pelo gestor. | Coerência entre proposta, confirmação, fila e catálogo. |

**Regra de decisão:** só considerar o caso satisfeito quando **O1–O6** estiverem observados. Se o gestor ou a fila estiverem indisponíveis, o resultado do **encaminhamento** é **BLOQUEADO**, mesmo que um protocolo tenha sido gerado. Não inferir sucesso a partir somente da mensagem de confirmação.

## 6. Tabela de decisão

| Situação documental | Pedido explícito de análise humana | Resultado esperado |
|---|---|---|
| Problema classificável, sem pedido humano | **Não** | Roteamento comum para órgão do catálogo (**CT-04**, fora deste caso). |
| Problema pouco claro, sem pedido humano | **Não** | Pode ser solicitada informação adicional; **não presumir fallback automático à Ouvidoria**. |
| Reclamação suficientemente descrita e pedido expresso de Ouvidoria | **Sim** | Proposta para revisão humana e, após aprovação, protocolo **sem órgão definitivo**, disponível à fila do **gestor** (**CT-10**). |

A representação técnica de órgão não atribuído (por exemplo, campo de departamento vazio) é apoio do **modelo existente** e não um novo requisito de apresentação de um campo específico na interface.

## 7. Evidências recomendadas e limites

**Registrar:** (a) texto fictício com pedido explícito; (b) proposta para revisão humana; (c) ausência de protocolo antes de aprovar; (d) confirmação e protocolo; (e) **mesmo protocolo** presente na lista de revisão do gestor, sem órgão atribuído. Se houver consulta ao banco, utilizar **somente como evidência auxiliar**, não como substituição à observação funcional.

**Não testar aqui:** atribuição posterior do órgão pelo gestor, processamento da reclamação, acessibilidade do portal, classificação de gravidade, encaminhamento automático em caso de confiança baixa, controle completo de permissões de outros perfis ou funcionamento de atendimento real. Não impor mensagem literal, categoria exata, número de tentativas ou código HTTP específico.

**Dados e segurança:** não publicar autenticação, credenciais, dados pessoais, conteúdo de conversas privadas, banco bruto nem chaves da configuração.

**Relevância:** o CT-04 cobre a classificação com **órgão conhecido e destino associado**. O CT-10 cobre a condição **excepcional**, em que o próprio cidadão pede análise humana e o sistema não deve inventar órgão para concluir o cadastro. Testa uma integração importante entre decisão do cidadão, formalização e fila da Ouvidoria, **sem adicionar requisitos**.
