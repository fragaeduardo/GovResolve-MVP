# Relatório de auditoria — V2 sem novos requisitos

**Revisão:** 05/11/2026. **Escopo:** teste funcional de caixa-preta do GovResolve-MVP.

## Veredito da versão anterior

**Não estava estritamente aderente aos requisitos como fonte normativa:** casos associavam regras técnicas do schema/código a RF002, RF004, RF015 etc., sem que o texto do RF estabelecesse tais limites.

## Resultado da revisão

- Casos originais: **98**.
- Mantidos com ajuste e fundamentação: **61**, separados em **38 com base apenas em RF/HU/RNF** e **23 que também dependem de regras anteriormente documentadas fora da especificação.**
- Excluídos da suíte normativa por ausência de exigência explícita: **37** (ver auditoria).
- Novos RF/HU criados: **zero**.
- Execução da suíte HTTP contra GovResolve: **nenhuma**; coleta de 8 testes realizada e todos pulados sem API configurada.
- Requisitos excluídos: RF005/HU004 (e-mail automático), conforme especificação vigente.
- RF001 gov.br: previsto para futuro; apenas perfil demo faz parte do MVP e não pode ser usado para declarar cumprimento de autenticação gov.br.

## Itens que não podem ser impostos ao projeto sem alteração formal dos requisitos

1. Título de 5–200 caracteres e descrição com mínimo de 15 caracteres: limites aparecem no código, **não no RF002**.
2. Escala de nota 1–5, comentário até 1.000 caracteres e substituição de avaliação: detalhes da implementação, **não do RF015/HU013**.
3. `page_size` de 1–100: restrição técnica, **não do RF004**.
4. Máscara `GR-YYYYMMDD-XXXX`: mencionada em README/arquitetura, mas **não em RF003**, cujo compromisso é a unicidade e associação; a máscara foi retirada da suíte estrita.
5. HTTP 401/403/404/422 específicos: não são respostas numericamente fixadas nos RFs; a aceitação usa o comportamento observável de permitir/bloquear a operação.
6. Idempotência da confirmação, comparação global do endpoint legado, cancelamento de sessão e versionamento por HTTP 409: são detalhes documentados no código ou implementação, mas não tratados como RFs obrigatórios.

## Regras já existentes usadas sem criar requisitos

- RF012 define as transições `ABERTO → EM ANDAMENTO → FECHADO`.
- RF014 exige o registro do resultado no fechamento.
- RF016 exige quatro gravidades e proíbe apresentar prazo sem regra oficial do órgão.
- `docs/arquitetura.md` contém aprovação humana e coleta progressiva: é **regra documental anterior**, não um RF novo.
- `docs/orgaos-competentes.md` define doze órgãos e fila de revisão Ouvidoria: é **regra documental anterior**, não um RF novo.

## Limite da revisão

**Esta revisão é de rastreabilidade e consistência documental, não de execução no software.** Não há confirmação de ausência de defeitos. Se a equipe considerar que somente `docs/especificacao-requisitos.md` é documento normativo, os 23 casos que também utilizam regras documentadas fora dele devem ser revisados para aprovação antes de serem apresentados como teste de aceitação.
