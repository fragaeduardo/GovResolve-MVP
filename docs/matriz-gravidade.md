# Matriz de Gravidade Operacional e Triagem de Demandas — GovResolve

## 1. Visão Geral e Fundamentação

A Matriz de Gravidade do GovResolve estabelece critérios objetivos, transparentes e auditáveis para priorizar o atendimento de demandas municipais conforme o risco à coletividade, integridade física de cidadãos, comprometimento de vias arteriais e continuidade de serviços públicos essenciais.

Essa priorização está em conformidade com:
- **Lei nº 13.460/2017** (Participação, proteção e defesa dos direitos do usuário dos serviços públicos da administração pública).
- **Princípio da Eficiência Administrativa** (Art. 37 da Constituição Federal).
- **Diretrizes de Governança Digital e Transparência Pública**.

---

## 2. Princípio Arquitetural: Momento da Execução (Pós-Human-in-the-Loop)

> **Regra Fundamental de Governança de IA:**
> A classificação de gravidade da demanda **NÃO** é executada durante o diálogo preliminar ou antes da validação do cidadão. Ela ocorre **estritamente após a aprovação explícita do cidadão no portão Human-in-the-Loop** (no momento da confirmação da proposta estruturada e execução da `DemandRegistrationTool`).

### Justificativas Técnicas e Operacionais:
1. **Fidelidade Factual e Não-Alucinação (RNF007):** Antes da confirmação humana, o cidadão pode alterar o endereço, corrigir o ponto de referência ou esclarecer a real proporção do ocorrido. Classificar previamente geraria falsos alertas ou distorções de prioridade no banco de dados.
2. **Dados Estruturados e Completos:** O `SeverityClassificationAgent` atua sobre uma demanda com endereço validado (logradouro, bairro, ponto de referência) e categoria homologada pelo cidadão.
3. **Imparcialidade e Auditoria:** O cidadão não é induzido a exagerar o relato para "ganhar prioridade" na tela do chat. A gravidade é um atributo de triagem técnica operacional municipal gerado a partir de critérios objetivos e fundamentados tecnicamente.

---

## 3. Níveis de Gravidade e Critérios de Triagem

| Nível de Gravidade | Critério de triagem | Escopo típico |
| :--- | :--- | :--- |
| **CRÍTICA** | Risco iminente à vida, à integridade física ou desastre. | Perigo imediato ou risco coletivo agudo. |
| **ALTA** | Impacto coletivo severo, interrupção de serviço essencial ou risco sanitário. | Comunidade, serviço essencial ou corredor de transporte. |
| **MÉDIA** | Dano funcional localizado que requer ação pública, sem risco iminente descrito. | Rua, equipamento ou serviço local. |
| **BAIXA** | Manutenção preventiva ou impacto reduzido, sem urgência descrita. | Ação pontual ou melhoria não emergencial. |

---

## 4. Agente Especialista: `SeverityClassificationAgent`

O `SeverityClassificationAgent` opera como o perito de triagem operacional municipal do GovResolve.

### Fluxo Operacional:
1. **Entrada:**
   - Título formal da demanda
   - Descrição factual aprovada pelo cidadão (com logradouro, bairro e referência)
   - Categoria do serviço
   - Órgão público destinatário
2. **Processamento:**
   - Avaliação contextual por IA. A classificação não depende de listas de palavras-chave e não promete prazo de atendimento.
   - Se a IA estiver indisponível, o registro recebe gravidade provisória MÉDIA com justificativa explícita de triagem humana pendente.
3. **Saída Estruturada:**
   - `severity`: enumeração (`CRITICA`, `ALTA`, `MEDIA`, `BAIXA`).
   - `severity_justification`: parecer técnico emitido pelo agente justificando o enquadramento na matriz.
4. **Persistência Relacional:**
   - Gravado na tabela `demands` nos campos `severity` e `severity_justification`.
   - Exibido nos painéis do cidadão e do servidor público.
   - Utilizado para ordenação e filtro prioritário da fila de atendimento do servidor.

---

## 5. Rastreabilidade e Transparência

- **Cidadão:** Ao gerar o protocolo, o cidadão vê a gravidade e sua justificativa. Nenhum prazo é apresentado sem uma regra oficial configurada pelo órgão responsável.
- **Servidor Público:** No painel operacional, as demandas são sinalizadas visualmente com badges de contraste estrito e podem ser filtradas por gravidade para agilizar o despacho das ordens de serviço críticas e altas.
- **Auditoria Interna:** Todas as transições de status e decisões são registradas na tabela `status_history`.
