# Plano de testes funcionais — revisão ESTRITA sem novos requisitos

**Data:** 05/11/2026. **Projeto:** GovResolve-MVP, Grupo 10.

## Princípio de aceite

O que não estiver definido como requisito funcional ou regra de negócio **já existente** não será imposto como resultado esperado. Código e schemas podem ajudar a localizar a interface para testar, mas não autorizam inventar regras. Em ambiguidade, documentar a lacuna: não preencher por suposição.

## Fontes vinculantes

1. `docs/especificacao-requisitos.md`: RF001–RF016, HUs, observação do MVP e RNF001 quando relacionado ao isolamento funcional de usuários.
2. `docs/arquitetura.md`: fluxo conversacional existente, confirmação humana, autoatendimento e comportamento diante da ambiguidade.
3. `docs/orgaos-competentes.md`: catálogo existente de 12 destinos e fila de revisão Ouvidoria.
4. `docs/backlog-moscow.md`: exclusão do registro anônimo, quando aplicável; **há divergência documental sobre RF005**, e a especificação de requisitos vigente define notificações como FORA do escopo.

## Resultado da revisão de 98 casos

- **Mantidos após revisão:** 61.
- **Excluídos:** 37. Todos listados individualmente em `auditoria_98_casos.csv`.
- **Fonte RF/HU/RNF ou regra já documentada em todos os casos mantidos:** sim.
- **RF005:** nenhum caso; requisito formalmente retirado do escopo.
- **RF001 gov.br:** não implementar/testar autenticação oficial inexistente; testes de perfil demo são representativos da versão acadêmica, mas NÃO comprovam RF001 integralmente.
- **Teste executado no sistema:** nenhum nesta revisão; status de todos é NÃO EXECUTADO.

## Técnicas de caixa-preta

- **Particionamento de equivalência:** casos permitidos/proibidos, acesso próprio/de terceiros, atendimento público/autoatendimento.
- **Análise de valores-limite:** é técnica prevista na disciplina, mas **não aplicada a campos numéricos nesta versão**, porque a especificação funcional vigente não estabelece faixas numéricas como 1–5, 5–200 ou 1–100. A máquina de estados é testada por tabela de decisão; os quatro níveis de gravidade, por partições de equivalência.
- **Tabela de decisão:** combinações de perfil e escopo, status e parecer, autoatendimento e triagem, aprovação humana. Nenhuma condição inventada.
- **Jornadas funcionais:** atendimento do cidadão, registro, protocolo, acompanhamento, conclusão e feedback.

## Evidências e aceite

Para cada caso: ID, versão/commit, pré-condições, dados sintéticos, passos, esperado, observado, status, evidência anonimizada e defeito relacionado. Não usar status PASSOU sem execução. Para regras com ambiguidade documental, registrar BLOQUEADO e pedir decisão da equipe antes de afirmar o resultado esperado.

## Pontos que NÃO são requisitos automaticamente

- Prefixo/expressão regular do protocolo; tamanho exato do título e da descrição; escala numérica e tamanho do comentário de avaliação; `page_size` 1–100; códigos HTTP específicos; política de atualização de feedback; operação de cancelamento; idempotência de requisições por versão; permissão de endpoint legado de comparação global.
- Esses itens podem ser documentados como **observações técnicas** ou candidatos a futura alteração de requisitos, sem ser testados como obrigações do produto atual.
