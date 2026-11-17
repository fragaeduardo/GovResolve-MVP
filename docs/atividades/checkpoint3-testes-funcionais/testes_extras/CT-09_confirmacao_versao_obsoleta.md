# CT-09 — Rejeitar confirmação de proposta desatualizada

**Situação:** teste complementar proposto com apoio de IA; **não executado** e não revisado pela equipe. **Não faz parte dos oito casos exigidos pelo Checkpoint 3.**

## Identificação e fundamentação

- **Funcionalidade:** registro de reclamação pelo chatbot, com revisão e aprovação humana.
- **Requisitos:** RF002 (registro após verificação), RF009 e RNF007 (fidelidade das informações), RF003 (protocolo apenas para demanda formalizada), HU002.
- **Regra existente decisiva:** [diagrama de sequência 03](../../../apresentacao/diagramas/03_sequencia.md) declara validação do cidadão e da **versão da proposta** na confirmação; a interface [ProposalCard](https://github.com/fragaeduardo/GovResolve-MVP/blob/main/frontend/src/components/chat/ProposalCard.tsx) apresenta versão e oferece ajuste.
- **Técnica:** transição de estados, caminho negativo de versão obsoleta, seguido de controle positivo.
- **Objetivo:** confirmar que aprovar a versão V1 **depois que ela foi substituída por V2** não formaliza a reclamação, preservando a possibilidade de aprovar V2.
- **Diferença:** CT-03 confere a correção do conteúdo; CT-08 repete uma confirmação **já formalizada**. CT-09 tenta confirmar V1 **obsoleta antes de qualquer registro**.

## Pré-condições e dados controlados

- Cidadão no ambiente demonstrativo, nova sessão sem protocolo ou demanda associada; ambiente de testes isolado.
- É possível enviar uma requisição de confirmação reproduzindo o contrato da interface, com os identificadores capturados da versão V1. Não se altera o código para provocar o cenário.
- **Entrada V1:** “Um bueiro está danificado na Rua 10, Setor Central, Goiânia. Solicito vistoria e reparo.”
- **Correção para V2:** “O endereço correto é Rua 12, Setor Central. A Rua 10 era uma informação incorreta e deve ser substituída como localização atual. Os demais fatos permanecem.”
- **Estímulo negativo:** confirmar com **o mesmo cidadão e sessão** e os identificadores/versão **V1**, quando a proposta vigente já é **V2**. Guardar somente identificadores fictícios ou sanitizados nas evidências.

## Passos

1. Iniciar a conversa e fornecer o relato; complementar, se necessário, até receber a proposta **V1**.
2. **Não confirmar V1**. Registrar a versão, o identificador da proposta e a ausência de protocolo/demanda.
3. Selecionar **“Não, quero ajustar”**, enviar a correção e aguardar proposta **V2**, atualizada e ainda não aprovada.
4. Enviar **uma única** requisição de confirmação contendo o identificador e a **versão antiga V1**; não enviar simultaneamente a confirmação de V2.
5. Conferir a resposta, a versão vigente da proposta e se houve geração de protocolo/demanda na sessão.
6. **Somente se o passo 4 foi rejeitado sem formalizar**, confirmar a **V2 atual** e conferir que o protocolo registrado corresponde à demanda com Rua 12. Se V1 foi indevidamente registrada, documentar e interromper a etapa positiva.

## Resultados esperados — oráculos verificáveis

| ID | Critério esperado | Fundamentação |
|---|---|---|
| **E1** | Revisar V1 produz proposta **V2**, na qual Rua 12 é localização atual, sem formalização antecipada. | RF009, RNF007; sequência 03 e tela 03. |
| **E2** | A confirmação de V1 **já substituída** não gera demanda nem protocolo. Não exigir mensagem ou status HTTP literais. | Validação da versão na sequência 03; RF002/RF003. |
| **E3** | Após a tentativa inválida, os dados correntes continuam sendo **V2**; não ocorre retorno silencioso para Rua 10. | RF009/RNF007; sequência 03. |
| **E4** | A confirmação **explícita de V2** permite gerar protocolo associado à demanda cuja localização atual é Rua 12, sem segundo registro. | RF002/RF003/RF009. |

**Regra de decisão:** caso **APROVADO somente se E1–E4 forem observados**. Se E2 falhar, registrar **REPROVADO** e não executar o passo 6. Se não for possível reproduzir a confirmação V1 no ambiente autorizado, registrar **BLOQUEADO**, e não presumir êxito por inspeção do código.

## Evidências e limitações

- Salvar proposta V1, proposta V2, ação de revisão e resposta à tentativa de confirmação antiga.
- Verificar a **ausência de demanda/protocolo** após a tentativa inválida; depois, se aplicável, a consulta da demanda da V2.
- Proteger sessões/credenciais; não publicar tokens, cookies, requisições completas nem dados pessoais.
- **Não cobre:** dois cidadãos, concorrência, formatos de protocolo, confirmação duplicada da versão já registrada (CT-08), nem correção da aplicação.
- **Nenhuma regra nova:** o critério principal decorre da validação de versão explicitada no diagrama; o resultado após V1 e V2 é uma forma verificável de testar esse contrato.
