# Testes extras — CT-09 e CT-10

**GovResolve-MVP · registro de reclamação por chatbot**

Estes dois testes são uma **ampliação opcional** da cobertura. Foram **propostos com apoio de IA**, **não executados** e ainda **não avaliados pela equipe**.

**A entrega oficial do Checkpoint 3 permanece com oito casos finais**, conforme o enunciado. Os oito casos e o PDF continuam em [04_oito_casos_finais.md](../04_oito_casos_finais.md) e [ENTREGA_CHECKPOINT3.pdf](../ENTREGA_CHECKPOINT3.pdf). **CT-07 e CT-08** continuam sendo os dois complementares exigidos pela atividade.

## Casos propostos

| Caso | Cenário novo | Principal diferença em relação aos oito |
|---|---|---|
| [CT-09 — Confirmação de versão obsoleta](CT-09_confirmacao_versao_obsoleta.md) | Tentar formalizar a V1 **após sua substituição pela V2**. | CT-03 verifica o conteúdo corrigido; CT-08 verifica repetição de uma confirmação já processada. |
| [CT-10 — Revisão humana pela Ouvidoria](CT-10_revisao_humana_ouvidoria.md) | Pedido **expresso** de revisão por pessoa, sem órgão definitivo, com protocolo e fila visível ao gestor. | CT-04 verifica órgão conhecido (COMURG), não o fluxo excepcional de destino pendente. |

## Como avaliar os novos testes

- Cada arquivo contém **requisitos e fontes**, objetivo, dados fictícios, pré-condições, passos, **oráculos numerados E1...**, evidências sugeridas e exclusões explícitas de escopo.
- Um caso é **aprovado somente se todos os critérios aplicáveis forem observados**. Falta de ambiente/evidência é bloqueio, não aprovação presumida.
- Utilizar ambiente de testes isolado, perfis autorizados e credenciais protegidas. Não publicar tokens nem sessões reais.
- Não executar casos em paralelo. Não alterar código da aplicação para forçar resultado positivo.
- A execução publicada dos **CT-01 a CT-08** se refere à versão anterior desses casos e **não comprova** qualquer resultado dos CT-09 e CT-10.
- **Nenhum novo requisito foi criado**: o controle de versão do CT-09 vem do diagrama de sequência; o pedido de revisão humana do CT-10 vem do catálogo e do fluxo multiagente.

## Por que os dois são complementares relevantes?

Os casos existentes já cobrem registro, coleta incompleta, correção, classificação/encaminhamento para órgão conhecido, fidelidade, gravidade, cancelamento e confirmação repetida. As duas lacunas adicionais são: **não formalizar uma ficha obsoleta** e **não inventar um órgão quando o cidadão solicita revisão humana**, ambas importantes para a integridade e confiabilidade do serviço público.

**Recomendação acadêmica:** não acrescentar os CT-09 e CT-10 ao PDF da atividade sem autorização para entregar mais de oito casos. Eles podem ser usados como material suplementar ou futura expansão de testes.