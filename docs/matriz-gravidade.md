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

## 3. Níveis de Gravidade, Critérios e SLAs Regulamentares

| Nível de Gravidade | Critério Central de Enquadramento | Escopo de Impacto | SLA Máximo de Atendimento | Exemplos Práticos por Órgão |
| :--- | :--- | :--- | :--- | :--- |
| **CRÍTICA** | Risco iminente à vida, à integridade física, perigo de desabamento ou contaminação aguda severa. | Imediato / Risco de Morte | **Até 24 horas** (Despacho Emergencial) | • Fiação elétrica de alta tensão caída na calçada (Iluminação/Energia)<br>• Cratera aberta em pista expressa sem sinalização (SEINFRA)<br>• Desabamento iminente de contenção ou muro público (SEINFRA/Defesa Civil)<br>• Vazamento de substância química ou combustível em via pública (AMMA/Bombeiros) |
| **ALTA** | Obstrução total de vias arteriais, interrupção de serviços vitais ou risco sanitário coletivo para comunidades. | Coletivo / Bairro / Corredores de Transporte | **Até 48 horas** (Atendimento Prioritário) | • Rompimento de adutora com falta generalizada de água no bairro (SANEAGO)<br>• Queda de árvore de grande porte interditando avenida principal (COMURG/SMM)<br>• Semáforo apagado em cruzamento de alto tráfego viário (SMM)<br>• Esgoto estourado a céu aberto em frente a creche ou hospital (SANEAGO/SMS)<br>• Falta de medicamentos de urgência na UPA (SMS) |
| **MÉDIA** | Danos funcionais, desconforto urbano ou falhas operacionais padrão sem perigo iminente de colapso. | Local / Rua Residencial | **5 a 7 dias úteis** (Prazo Padrão de Zeladoria) | • Buraco ou asfalto danificado em rua residencial secundária (SEINFRA)<br>• Lâmpada de poste queimada em via local (Iluminação Pública)<br>• Vazamento de água limpa no meio-fio ou calçada (SANEAGO)<br>• Atrasos recorrentes em linha de ônibus municipal (SMM)<br>• Falta pontual de medicamento de uso contínuo com reposição prevista (SMS) |
| **BAIXA** | Manutenção preventiva, zeladoria leve, estética urbana e melhorias não emergenciais. | Pontual / Preventivo / Estético | **Até 15 dias úteis** (Programação Preventiva) | • Pintura e repintura de meio-fio desgastada na praça (COMURG)<br>• Roçagem de mato alto em calçada sem obstrução de passagem (COMURG)<br>• Solicitação de instalação de nova lixeira pública ou banco (COMURG)<br>• Substituição de placa informativa ou toponímica desbotada (SMM) |

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
   - Avaliação semântica via OmniRoute LLM (temperatura baixa: 0.1) com fallback imediato em motor determinístico especialista baseado em matriz de risco urbano.
3. **Saída Estruturada:**
   - `severity`: enumeração (`CRITICA`, `ALTA`, `MEDIA`, `BAIXA`).
   - `severity_justification`: parecer técnico emitido pelo agente justificando o enquadramento na matriz.
4. **Persistência Relacional:**
   - Gravado na tabela `demands` nos campos `severity` e `severity_justification`.
   - Exibido nos painéis do cidadão e do servidor público.
   - Utilizado para ordenação e filtro prioritário da fila de atendimento do servidor.

---

## 5. Rastreabilidade e Transparência

- **Cidadão:** Ao gerar o protocolo, o cidadão é informado sobre a gravidade atribuída e a justificativa técnica correspondente, garantindo clareza quanto ao prazo estimado (SLA) de atendimento.
- **Servidor Público:** No painel operacional, as demandas são sinalizadas visualmente com badges de contraste estrito e podem ser filtradas por gravidade para agilizar o despacho das ordens de serviço críticas e altas.
- **Auditoria Interna:** Todas as transições de status e decisões são registradas na tabela `status_history`.
