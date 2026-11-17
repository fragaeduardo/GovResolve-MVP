# 5. Matriz de rastreabilidade, decisões, pendências e reflexão

## 5.1 Rastreabilidade (uma linha por vínculo relevante)

| Requisito ou HU | Caso | Cenário coberto | Fonte consultada |
|---|---|---|---|
| RF002 / HU002 | CT-01 | Registro confirmado | Especificação RF002; HU002; diagrama de sequência 03; tela 04 |
| RF003 / HU002 | CT-01 | Protocolo único após confirmação | Especificação RF003; HU002; sequência 03; tela 04 |
| RF002 / HU002 | CT-02 | Entrada insuficiente sem formalização | RF002; fluxo 04 (dados faltantes); tela 02 |
| RF002 / RF009 | CT-03 | Revisar informação antes de confirmar | RF002/RF009; diagrama 03 (loop); tela 03 |
| RF008 | CT-04 | Classificação da demanda | RF008; catálogo de órgãos; sequência 03 |
| RF010 / HU008 | CT-04 | Destino SEINFRA conforme catálogo | RF010/HU008; catálogo; componente 02; sequência 03 |
| RF009 / HU007 | CT-05 | Fidelidade factual na proposta | RF009; HU007; sequência 03 |
| RNF007 | CT-05 | Não inventar nem distorcer fatos | RNF007; protótipo da revisão |
| RF016 / HU014 | CT-06 | Gravidade pós-aprovação e justificativa | RF016/HU014; sequência 03; tela 04 |
| RF002 / RF003 | CT-07 | Cancelamento pré-registro sem protocolo | RF002/RF003; ProposalCard (cancelamento); sequência 03 |
| RF003 / HU002 | CT-08 | Confirmação repetida da mesma versão | RF003/HU002; sequência 03; classes 01 |

**Nota sobre RF010:** a verificação de que a demanda está efetivamente **disponível ao setor destinatário** exige observar o módulo de servidor, fora do recorte selecionado. O CT-04 rastreia a sugestão e vínculo do destino, não comprova sozinho o encaminhamento final. Essa parte continua como limitação de cobertura, não evidência aprovada.

**Nota sobre RF016:** observar os quatro rótulos possíveis não significa verificar que a gravidade calculada está “correta” para toda situação. O teste é de contrato e ordem temporal.

## 5.2 Como a IA foi utilizada

Ferramenta: **ChatGPT (OpenAI, GPT-6)**. Foram fornecidas informações de RFs/HUs, do catálogo, dos diagramas e dos protótipos do GovResolve, com a solicitação de seis cenários funcionais estruturados. O material foi confrontado com as fontes para revisar resultados esperados, corrigir extrapolações e produzir uma matriz de rastreabilidade. **Oito casos são especificações; nenhum foi executado.** O grupo deve validar os dois casos complementares e o PDF antes do Checkpoint 3.

## 5.3 Decisões documentadas

| Decisão | Justificativa |
|---|---|
| Selecionar apenas registro de reclamação conversacional até protocolo | O enunciado limita a UMA funcionalidade e há diagrama de sequência e telas correspondentes. |
| Produzir seis casos iniciais, preservando suas falhas | Necessário à análise crítica exigida; não esconder invenções da primeira geração. |
| Manter CT-01/CT-03 e corrigir CT-02/CT-04/CT-05/CT-06 | Somente os resultados estritamente sustentados devem figurar na versão final. |
| Complementar com CT-07 e CT-08 | Cobrem cancelamento e confirmação repetida explicitados pelo protótipo/diagrama, sem adicionar requisitos. |
| Não executar testes, não chamar modelos, não medir métricas | Enunciado afirma que a atividade é PROJETO e REVISÃO; execução não é exigida. |
| Preservar código do GovResolve e remover suíte V2 extensa da árvore atual | A suíte com 61 casos não representa a entrega deste checkpoint e poluía o repositório. |
| Manter benchmarks legados de triagem do produto, independentes da suíte V2 | Não foram produzidos por essa atividade; apagar tais arquivos poderia retirar recursos anteriores do projeto. |
| Publicar documentação em pasta separada de teste acadêmico | Separa o exercício de análise crítica dos testes automatizados do produto. |

## 5.4 Pendências reais de especificação

1. **Campos obrigatórios (RF002):** não estão enumerados por categoria. Melhorar a especificação futuramente com regras de completude e seus exemplos; não declarar um campo ou mensagem obrigatória agora.
2. **Comprovação do encaminhamento (RF010):** identificar a evidência observável da disponibilidade ao órgão destinatário para testes futuros.
3. **Escopo da gravidade (RF016):** os quatro níveis e a justificativa são definidos, mas não há limiar numérico por exemplo. Não atribuir CRITICA automaticamente.
4. **Regras de cancelamento:** a interface contém a ação pré-autuação, mas não descreve recuperação, texto de resposta ou limpeza de sessão; o CT-07 não exige esses comportamentos.
5. **Histórico e caminho direto da API:** possíveis diferenças do status inicial entre documentos e caminhos internos merecem revisão posterior, sem interferir na função delimitada.
6. **Critérios de aceitação formalizados:** não se encontrou uma lista independente para esse fluxo. Fontes usadas: RF/HU, sequência e protótipos.

## 5.5 Síntese reflexiva

A IA foi útil para montar uma primeira cobertura de cenários positivos, negativos e alternativos, mas produziu expectativas que pareciam precisas sem respaldo documental. A informação decisiva na avaliação foi: **RF002** (completude sem campos universalmente definidos), **RF009/RNF007** (fidelidade sem cópia literal), **RF016** (gravidade após aprovação, sem SLA fictício) e os **diagramas/protótipos**, que delimitam quando a demanda realmente é registrada. A qualidade da proposta dependeu da revisão da fundamentação, não da quantidade de casos produzidos.

## 5.6 Checklist do enunciado

- [x] Projeto, equipe, funcionalidade e fontes identificados.
- [x] Síntese do comportamento em até cinco linhas.
- [x] Seis casos iniciais gerados com IA, preservados separadamente.
- [x] Revisão individual MANTER/CORRIGIR/EXCLUIR com justificativa.
- [x] Oito casos finais estruturados: seis revisados e dois complementares propostos.
- [x] Matriz requisito/caso/fonte.
- [x] Crítica concreta à geração por IA e melhorias de especificação.
- [x] Ferramenta de IA e forma de uso descritas.
- [x] Reflexão crítica.
- [ ] Validação final de conteúdo pelos integrantes do grupo.
- [ ] Conferência visual e apresentação do PDF consolidado no Checkpoint 3.

**Documento de referência da atividade:** [Oficina de Teste de Software com IA — Projeto Integrador](https://docs.google.com/document/d/1xD2cu0jp7f6ROX9VbzRxE_ixNVH68iYh/edit).