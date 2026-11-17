# Testes adicionais opcionais — CT-09 e CT-10

**Situação:** dois **casos extras** de projeto de testes funcionais de caixa-preta, elaborados com apoio de IA em 17/11/2026. **Não executados** e **ainda não revisados/validados pela equipe**. Os oito casos oficiais CT-01 a CT-08 continuam em [04_oito_casos_finais.md](../04_oito_casos_finais.md), e a **entrega do Checkpoint 3 continua sendo o PDF com exatamente oito casos**. A professora não exige execução e não solicitou um documento de dez casos.

| Caso | Caminho ainda não coberto pelos oito oficiais | Teste novo |
|---|---|---|
| **CT-09** | CT-03 cobre a qualidade da correção; CT-08 cobre repetir a confirmação **já registrada**. Falta confirmar que uma **versão substituída, ainda não formalizada**, não pode ser aprovada. | [CT-09 — proposta desatualizada](CT-09_proposta_desatualizada.md) |
| **CT-10** | CT-04 cobre a classificação para um órgão específico. Falta cobrir o **pedido explícito do cidadão para revisão humana** e a disponibilidade do protocolo na **fila da Ouvidoria**. | [CT-10 — revisão humana da Ouvidoria](CT-10_revisao_humana_ouvidoria.md) |

## Rastreabilidade complementar

| Fonte existente | Caso/oráculos | Condição coberta |
|---|---|---|
| RF002, RF009 e RNF007 | CT-09/O1, O4 e O5 | Proposta vigente preserva correções do cidadão. |
| Diagrama de sequência 03: validação da versão antes de formalizar | CT-09/O2 e O3 | Confirmar versão antiga **não cria** protocolo nem demanda. |
| RF003 e HU002 | CT-09/O5 | Confirmar versão atual registra uma única demanda e gera protocolo. |
| Catálogo de órgãos: seção **Casos não classificados** | CT-10/O1, O3, O4, O5 e O6 | Pedido humano expresso; registro sem órgão definitivo; presença na fila de revisão do gestor. |
| RF002, RF003, RF009 | CT-10/O2 e O3 | Reclamação fiel e protocolo somente após confirmação. |
| Diagrama multiagente 04, RF008 e RF010 | CT-10/O1, O4 a O6 | Exceção de encaminhamento para análise humana, sem inventar destino. |

**Referências internas:** [requisitos RF/HU](../../../especificacao-requisitos.md), [diagrama de sequência](../../../apresentacao/diagramas/03_sequencia.md), [diagrama multiagente](../../../apresentacao/diagramas/04_multiagentes_tools.md) e [catálogo de órgãos](../../../orgaos-competentes.md).

## Como os casos foram desenhados

- **CT-09:** partição de equivalência por versão (vigente versus antiga), transição de estados e tabela de decisão; combina rejeição de confirmação obsoleta e recuperação positiva por confirmação da ficha atual.
- **CT-10:** fluxo excepcional documentado, partição por destino (órgão cadastrado versus revisão humana expressa), verificação funcional do registro e da consulta **somente-leitura** na fila do gestor.
- Ambos contêm **pré-condições, entradas literais fictícias, passos reproduzíveis, resultados esperados O1–O5/O6, fontes normativas, evidências sugeridas, limites e justificativas de cobertura**.

**Não foram inventados** códigos HTTP obrigatórios, mensagens literais, limiares de classificação, campos universais, regras automáticas de fallback ou novos requisitos. O uso de arquivos de código como evidência complementar **não os transforma em requisitos novos**.

## Verificação/execução futura

Usar somente ambiente e banco de testes isolados, perfis demonstrativos autorizados, dados fictícios e consultas de leitura. Guardar evidências da transição de estado e conferir **todos os oráculos**, sem modificar a aplicação ou os resultados esperados para fazer o teste passar. Se faltar acesso ou evidência obrigatória, registrar **BLOQUEADO**, não **APROVADO**.

A antiga campanha publicada em [execucao/RELATORIO_FINAL.md](../execucao/RELATORIO_FINAL.md) avaliou **outra versão dos oito casos originais**. Ela **não** contém resultados dos CT-09/CT-10.

**Separação acadêmica:** só incorporar novos casos ao PDF se o docente permitir ou pedir formalmente. Até lá, os dez casos totais são **8 oficiais + 2 extras documentados**, não uma alteração da entrega.
