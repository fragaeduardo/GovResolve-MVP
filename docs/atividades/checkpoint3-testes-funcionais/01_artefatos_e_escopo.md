# 1. Seleção da funcionalidade e interpretação dos artefatos

## 1.1 Identificação

- **Projeto:** GovResolve — Plataforma de Gestão, Triagem e Encaminhamento de Demandas Públicas.
- **Grupo:** Grupo 10 (Ctrl+Z).
- **Integrantes:** Eduardo Fraga Pereira (202405847), Ralph dos Reis Torres (202406925), Samuel Amorim Jaime (202205559), Wender Viana Faria Santos (202401832).
- **Funcionalidade escolhida:** registro de reclamação pública pelo portal do cidadão, por meio de conversa, coleta progressiva, revisão/aprovação e formalização com protocolo.
- **Limite:** abrange a elaboração e **formalização/encaminhamento** da demanda até o protocolo; não inclui tratamento, atualização de status, conclusão nem avaliação pelo servidor. **CT-04 exige uma única consulta de leitura na fila do órgão apenas como evidência de que RF010 foi cumprido** (demanda disponível ao destinatário).
- **Pré-condição geral:** cidadão no portal acadêmico de demonstração, com acesso ao fluxo de reclamação. O gov.br oficial é previsto para o futuro e **não é simulado como autenticação real**.

## 1.2 Requisitos e histórias existentes

| ID | Regra ou comportamento relevante | Papel no teste |
|---|---|---|
| **RF002** | Registrar demanda com descrição da situação e do atendimento solicitado; conferir informações obrigatórias antes de concluir. | Coleta e validação pré-registro. |
| **RF003** | Gerar protocolo único, apresentá-lo após confirmação e associá-lo à mesma demanda. | Resultado do registro. |
| **RF008** | Classificar demandas para atendimento público com apoio de IA, conforme categorias do órgão. | Classificação e destino. |
| **RF009** | Organizar informações preservando fatos e sentido do relato. | Fidelidade da proposta. |
| **RF010** | Encaminhar a demanda ao setor competente; só concluir o encaminhamento quando disponível ao destinatário. | Sugestão de destino **e verificação efetiva da disponibilidade** na fila destinatária. |
| **RF016** | Classificar gravidade **após aprovação humana**, em CRITICA/ALTA/MEDIA/BAIXA, com justificativa; sem prazo sem regra oficial. | Momento e conteúdo da classificação, sem gravidade arbitrária. |
| **RF011 (apoio)** | Servidor consulta demandas de seu escopo. | Consulta **somente-leitura** para demonstrar o resultado de RF010, não testar tratamento. |
| **RNF006** | Só indicar encaminhamento concluído após disponibilidade ao destinatário. | Diferenciar destino sugerido de encaminhamento concluído. |
| **RNF007** | Organização da IA preserva fatos, sentido e incertezas. | Matriz semântica de CT-03 e CT-05. |
| **HU002** | Como cidadão, registrar solicitação e receber protocolo único. | Jornada principal. |
| **HU007** | Como servidor, consultar informações organizadas e fiéis. | Referência à qualidade dos dados produzidos. |
| **HU008** | Como cidadão, ter a demanda direcionada ao setor competente. | Encaminhamento. |
| **HU014** | Priorização/triagem com gravidade após aprovação e indicação de provisório quando aplicável. | Complementa RF016. |

**Critérios de aceitação:** não foi identificada uma lista independente e formal de critérios de aceitação para essa funcionalidade. Empregam-se os requisitos e os comportamentos explícitos dos diagramas/protótipos, **sem inventar critérios adicionais**.

## 1.3 UML e protótipos utilizados

| Fonte | Informações relacionadas |
|---|---|
| [Diagrama de classes — 01_classes.md](../../apresentacao/diagramas/01_classes.md) | Usuário, Demanda, Órgão, Histórico; protocolo e relações entre registros. |
| [Diagrama de componentes — 02_componentes.md](../../apresentacao/diagramas/02_componentes.md) | Portal React, REST, atendimento inteligente, serviço de demandas, banco e sessão. |
| [Diagrama de sequência — 03_sequencia.md](../../apresentacao/diagramas/03_sequencia.md) | Ciclo de coleta/revisão, confirmação da proposta, gravidade, gravação e retorno de protocolo; descreve também confirmação repetida. |
| [Fluxo conversacional — 04_multiagentes_tools.md](../../apresentacao/diagramas/04_multiagentes_tools.md) | Separação entre coleta, proposta e registro. |
| [Tela 02 — Conversa](../../apresentacao/telas/02_conversa.png) | Relato e complementação via chatbot. |
| [Tela 03 — Revisão](../../apresentacao/telas/03_revisao.png) | Aprovar, ajustar ou cancelar antes de registrar. |
| [Tela 04 — Protocolo](../../apresentacao/telas/04_protocolo.png) | Confirmação e apresentação do protocolo. |
| [Tela 06 — Servidor](../../apresentacao/telas/06_servidor.png) | Em CT-04, leitura da demanda recém-criada para verificar **disponibilidade ao órgão**. |
| [Catálogo de órgãos](../../orgaos-competentes.md) | Bueiros/iluminação → SEINFRA; **lixo/limpeza → COMURG**; semáforos → SET (catálogo demonstrativo). |

Os arquivos de telas são capturas do protótipo acadêmico com dados fictícios; não são evidência de que os casos foram executados com IA real.

## 1.4 Comportamento esperado — até cinco linhas

1. O cidadão descreve uma reclamação; a interface conversa e solicita complementos quando necessário.
2. A IA organiza os fatos e, com dados suficientes, sugere classificação e órgão conforme o catálogo.
3. A proposta pode ser revisada/corrigida antes de uma aprovação explícita do cidadão.
4. Após a aprovação, a gravidade é classificada e o sistema registra a demanda e seu destino.
5. O registro gera um protocolo único, que é exibido ao cidadão e associado à demanda.

## 1.5 Restrições adotadas na preparação

- Dados dos cenários são fictícios: exemplos de ruas/setores não identificam pessoas reais.
- Não declarar resultado esperado textual para mensagens que não estejam definidas nos artefatos.
- Não pressupor um endereço universalmente obrigatório; RF002 não enumera campos por categoria de demanda.
- Não predeterminar o nível de gravidade de um relato sem regra documentada.
- Não assumir equivalência entre o fluxo de demonstração acadêmico e autenticação real gov.br.
- Não atribuir aos casos **aprimorados** resultados da execução de 17/11/2026: a campanha do GitHub se refere às **entradas e oráculos anteriores**, preservados em `execucao/`.
- Verificar **todas as condições esperadas** de cada cenário, distinguindo sugestão de órgão e disponibilidade efetiva para consulta pelo setor.

**Técnicas empregadas:** caixa-preta funcional; particionamento de equivalência (entrada suficiente/insuficiente), cobertura dos estados pré/pós-confirmação, fluxos alternativos (revisão/cancelamento), tabela de decisão temporal (RF016), oráculos de integridade semântica (RF009/RNF007), cenário de duplicidade (CT-08) e integração funcional apenas para comprovar o resultado de RF010. **Análise de valores-limite numérica não é aplicável sem limites documentados; nenhum foi inventado**.