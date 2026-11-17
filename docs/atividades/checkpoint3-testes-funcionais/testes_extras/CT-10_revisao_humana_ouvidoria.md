# CT-10 — Registro com pedido explícito de revisão humana pela Ouvidoria

**Situação:** teste complementar proposto com apoio de IA; **não executado** e ainda não revisado pela equipe. **Fora dos oito casos oficiais do Checkpoint 3.**

## Identificação e fundamentação

- **Funcionalidade:** registro e encaminhamento de reclamação pública pelo chatbot.
- **Requisitos existentes:** RF002 (registro), RF003 (protocolo), RF008 (triagem), RF009 (preservação dos fatos), RF010 (destino) e HU002/HU008; RNF006 (não confundir sugestão com encaminhamento concluído).
- **Regra específica comprovada nos artefatos:** [catálogo de órgãos — Casos não classificados](../../../orgaos-competentes.md): a Ouvidoria é **fila de revisão e não o 13º órgão**, aceita a expressão **“encaminhar para ouvidoria”**, gera protocolo **sem órgão atribuído** e apresenta a demanda na fila **Revisão da Ouvidoria** para o gestor. O [fluxo multiagente 04](../../../apresentacao/diagramas/04_multiagentes_tools.md) descreve essa exceção mediante **pedido explícito** de análise humana.
- **Técnica:** fluxo alternativo excepcional; partição de destino indeterminado e prova de disponibilidade para análise humana.
- **Objetivo:** verificar que o pedido expresso de revisão humana resulta em **protocolo válido, sem órgão definitivo inventado, com demanda consultável pelo gestor na fila de revisão**.
- **Diferença dos casos oficiais:** CT-04 testa órgão classificado (COMURG); CT-10 testa **destino ainda não atribuído**, mediante opção expressamente solicitada. CT-02 testa relato insuficiente, o que não é o objetivo aqui.

## Pré-condições e massa fictícia

1. Ambiente isolado com perfis de **cidadão** e **gestor**; fila administrativa **Revisão da Ouvidoria** acessível ao gestor em modo consulta. Não efetuar atribuição de destino nesse teste.
2. Nova sessão de reclamação, sem protocolo ou demanda formalizada.
3. **Entrada principal:** “Há um problema de manutenção em uma área pública no Setor Central, Goiânia, e preciso solicitar vistoria e reparo. Não consigo identificar qual órgão deve receber o pedido. Quero que uma pessoa analise o destino: **encaminhar para ouvidoria**.”
4. Caso a plataforma necessite de informações adicionais sobre a situação/serviço, fornecer **somente esclarecimentos fictícios coerentes**, sem apontar um órgão final. O estímulo essencial é o pedido **explícito**; não criar obrigação de roteamento automático para qualquer mensagem ambígua.

## Passos reproduzíveis

1. Entrar como cidadão no portal de demonstração, iniciar reclamação e enviar a mensagem que contém **“encaminhar para ouvidoria”**.
2. Responder a pedidos de complemento, se houver, até obter proposta de registro. Conferir se ela **respeita o pedido de revisão humana** e preserva problema e atendimento solicitado.
3. Antes da confirmação, observar ausência de demanda/protocolo de registro associado à sessão.
4. **Aprovar explicitamente** a proposta pelo fluxo de registro.
5. Registrar o protocolo apresentado; consultar a reclamação do cidadão pelo mesmo identificador.
6. Como **gestor demonstrativo**, abrir a fila **Revisão da Ouvidoria** em modo **somente leitura**. Localizar o mesmo protocolo e verificar se permanece **sem órgão definitivo atribuído**. Não atribuir destino, alterar status nem tratar a demanda.

## Resultados esperados — oráculos verificáveis

| ID | Critério esperado | Fundamentação |
|---|---|---|
| **E1** | A proposta reconhece a **solicitação expressa de revisão humana**, preserva os fatos fornecidos e não exige que a IA invente um órgão para apresentá-la. | RF002/RF009 e exceção do fluxo 04. |
| **E2** | Antes da aprovação da proposta, não há demanda formalizada nem protocolo para essa sessão. | RF002/RF003; sequência 03. |
| **E3** | Após aprovação, a reclamação é registrada e recebe **um protocolo único**, associado à demanda consultável pelo cidadão. | RF003/HU002; sequência 03. |
| **E4** | A demanda **ainda não possui órgão definitivo** (o vínculo do departamento está ausente/nulo, caso exposto). “Ouvidoria” não é atribuído como 13º órgão. | Catálogo — Casos não classificados. |
| **E5** | O **mesmo protocolo** aparece para o **gestor** na fila **Revisão da Ouvidoria**, disponível para análise humana posterior. | Catálogo e fluxo 04; interface administrativa. |
| **E6** | Nenhum encaminhamento é declarado **concluído para órgão específico** antes de atribuição efetiva de destino. A ausência de órgão não deve ser confundida com falha de registro/protocolo. | RF010/RNF006 e catálogo. |

**Regra de decisão:** considerar **APROVADO somente se E1–E6 forem observados**. Se a consulta autorizada à fila for impossível, **E5 fica BLOQUEADO/NÃO VERIFICADO**; não converter a mera geração de protocolo em “encaminhamento concluído”.

## Evidências, justificativa e limites

- Captura da mensagem com solicitação explícita, proposta antes da aprovação, tela de protocolo e consulta da demanda.
- Captura da fila administrativa **somente leitura** com o mesmo protocolo e sem órgão final; quando houver, observação técnica sanitizada do vínculo ausente.
- Nenhuma credencial, token, cookie, dado pessoal ou requisição integral deve ser publicado.
- **Não exigir:** que qualquer relato ambíguo seja enviado automaticamente à Ouvidoria, texto literal de resposta, código HTTP específico, gravidade fixa, conclusão do tratamento, atribuição posterior pelo gestor ou tempo de atendimento.
- Este teste é especialmente relevante porque diferencia **uma decisão segura de não atribuir destino sem evidência** de uma classificação forçada pela IA; sua base é um **caminho documentado**, não uma regra nova.
