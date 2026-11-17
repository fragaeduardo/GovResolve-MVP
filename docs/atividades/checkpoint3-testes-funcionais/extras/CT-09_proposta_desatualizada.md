# CT-09 — Confirmar versão obsoleta sem formalizar a demanda

**Tipo:** teste extra, opcional, de caixa-preta. **Origem:** proposta com IA. **Revisão pelo grupo:** pendente. **Execução:** NÃO EXECUTADO. Não integra os oito testes finais obrigatórios do Checkpoint 3.

## 1. Identificação

| Elemento | Definição |
|---|---|
| **Objetivo** | Verificar que confirmar uma ficha antiga **substituída antes do registro** não formaliza a reclamação e não impede confirmar a ficha atual. |
| **RF/HU relacionados** | RF002 (registro), RF003/HU002 (protocolo após confirmação), RF009 e RNF007 (fidelidade às informações corrigidas). |
| **Regra documental específica** | [Diagrama de sequência](../../../apresentacao/diagramas/03_sequencia.md): o fluxo valida **cidadão e versão** antes da formalização; [fluxo de revisão](../../../apresentacao/diagramas/04_multiagentes_tools.md): correção gera nova proposta antes de aprovação. |
| **Implementação consultada, apenas como evidência** | [Rota de confirmação](https://github.com/fragaeduardo/GovResolve-MVP/blob/main/src/api/routes/demands.py) e [FormalizationAgent](https://github.com/fragaeduardo/GovResolve-MVP/blob/main/src/ai/agents/formalization_agent.py) verificam a versão recebida. |
| **Técnicas** | Partição de equivalência **versão vigente × obsoleta**, transição de estados e teste negativo seguido de recuperação positiva. |

**Por que não é CT-03 nem CT-08?** CT-03 verifica se o ajuste corrige a ficha; CT-08 verifica a **repetição da mesma confirmação já registrada**. Este caso testa uma aprovação **de versão substituída enquanto ainda não existe demanda**.

## 2. Pré-condições

1. Cidadão no portal de demonstração, em **sessão nova e sem demanda registrada**, usando dados fictícios.
2. Fluxo conversacional acessível e capaz de apresentar propostas versionadas.
3. Possibilidade de guardar identificadores realmente retornados pelo sistema e reenviar a confirmação da versão antiga, **pelo próprio cidadão autorizado**, usando o contrato de confirmação, quando o cartão antigo não estiver mais visível.
4. Consulta autorizada para verificar protocolo e demanda associados à sessão, sem depender de logs internos; banco de teste isolado recomendado.

## 3. Entradas e controle da massa de teste

- **Relato original:** “Há um bueiro danificado próximo à Rua 10, Setor Central, Goiânia. Solicito vistoria e reparo.”
- **P1:** primeira proposta de confirmação, antes da correção. Guardar o identificador, o número da **versão antiga V1**, o conteúdo e o identificador da sessão retornados. V1 é um **rótulo relativo**, não um número fixo imposto ao sistema.
- **Correção do cidadão:** “Corrija a localização para Rua 12, Setor Central. A Rua 10 estava errada e não pode aparecer como localização atual. Mantenha o bueiro danificado e o pedido de vistoria e reparo.”
- **P2:** proposta nova depois do ajuste, com **versão vigente V2**, localização Rua 12. Registrar versão e identificadores reais.
- **T1 inválida:** reenviar confirmação com os identificadores e **versão antiga V1**, sem mudar cidadão, sessão ou dados da requisição capturada.
- **T2 válida:** confirmar **P2 vigente**, usando seus identificadores e versão atual; só executar **após** comprovar que T1 não criou demanda.

## 4. Passos reproduzíveis

1. Abrir nova sessão e enviar o relato inicial.
2. Registrar P1, versão/identificadores e evidência de que **ainda não existe demanda ou protocolo** da sessão.
3. Acionar **Não, quero ajustar**, enviar a correção e aguardar P2. Verificar que a proposta atual contém Rua 12 e é uma versão posterior à P1.
4. **Sem aprovar P2**, tentar confirmar P1 por requisição autorizada com versão/identificadores antigos; capturar a resposta observada.
5. Consultar o estado do atendimento e a existência de demandas associadas à sessão **após a tentativa inválida**.
6. Aprovar a P2 vigente de modo autorizado; consultar o protocolo e os dados do registro.
7. Verificar que foi criada **apenas uma demanda**, com localização corrente Rua 12 e somente depois da aprovação de P2.

## 5. Resultados esperados (oráculos)

| ID | Critério objetivo | Como observar |
|---|---|---|
| **O1** | Após a correção, P2 é a proposta **vigente**, posterior à P1, com localização Rua 12. | Proposta exibida, versão identificada e conteúdo da ficha. |
| **O2** | **T1 não é aceita** como aprovação de P2. Não exigir código HTTP nem frase de erro específicos. | Reação visível/retorno do contrato de confirmação. |
| **O3** | T1 **não gera protocolo, cadastro de demanda nem confirmação de registro**. | Consulta funcional de demandas/sessão após T1; banco apenas como apoio. |
| **O4** | A rejeição de T1 **não apaga nem reverte P2**; o cidadão ainda consegue confirmar a proposta atual. | Consulta/recuperação da ficha vigente. |
| **O5** | Confirmar P2 gera **uma única demanda com protocolo**, cujas informações vigentes refletem a correção Rua 12 e preservam o problema e o pedido do cidadão. | Protocolo, consulta da demanda e comparação da ficha final. |

**Regra de decisão:** atender **O1 a O5**. Se não for possível reproduzir T1 sob a identidade legítima da sessão, registrar **BLOQUEADO**, nunca “APROVADO” por suposição. A rejeição T1, sem comprovar ausência de registro e recuperação pela P2, **não basta**.

## 6. Tabela de decisão

| Situação da sessão | Proposta confirmada | Resultado esperado |
|---|---|---|
| P2 apresentada, nenhuma formalização | **P1 obsoleta** | **Não registrar** e preservar P2 (T1). |
| P2 apresentada, nenhuma formalização | **P2 vigente** | Registrar a ficha atual e gerar protocolo (T2). |
| Demanda já registrada para a mesma sessão | Repetir proposta aprovada | Fora do CT-09; corresponde ao **CT-08**. |

## 7. Evidências e limites

**Registrar:** (a) P1 com versão; (b) correção enviada; (c) P2 com versão e localização; (d) tentativa T1 e sua resposta; (e) ausência de demanda após T1; (f) aprovação de P2 e único protocolo com dados corretos. Não publicar credenciais, dados reais, tokens ou identificadores privados de sessão.

**Não presumir:** código HTTP 409, mensagem textual específica, possibilidade de confirmar versão obsoleta por botão visível, versões de outro cidadão, concorrência ou comportamento de sessões expiradas. A identidade e a versão devem ser as **efetivamente retornadas** pelo sistema; nenhum número ou limite é inventado.

**Relevância:** protege a integridade do **Human-in-the-Loop**, evitando que um cidadão revise a ficha corretamente e, ainda assim, o backend registre uma aprovação obsoleta. É uma lacuna documentada e distinta dos oito casos anteriores.
