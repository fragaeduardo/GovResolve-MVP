# 3. Revisão crítica dos seis casos inicialmente gerados com IA

**Etapa exigida pelo enunciado:** confronto **individual** de pré-condições, entradas, passos e resultados esperados com RF/HU, diagramas e telas do GovResolve. Os seis casos iniciais permanecem **integralmente preservados** em [02_seis_casos_gerados_ia.md](02_seis_casos_gerados_ia.md). A versão aperfeiçoada está em [04_oito_casos_finais.md](04_oito_casos_finais.md).

**Regra de decisão da revisão:** MANTER = cenário e resultado esperados já são sustentados pelos artefatos (permitidos refinamentos de clareza); CORRIGIR = há afirmação não documentada, oráculo impreciso ou cobertura incompleta; EXCLUIR = cenário inválido ou impossível de fundamentar. **Não houve exclusão**, porque os seis cenários têm núcleo válido e podem ser corrigidos. **MANTER não equivale a APROVADO na execução**.

## 3.1 Decisões justificadas, caso a caso

| Caso | Decisão sobre os 6 iniciais | Análise crítica | Evidência decisiva | Correção ou refinamento na versão final |
|---|---|---|---|---|
| **CT-01** Registro com protocolo | **MANTER** | O cenário completo e a confirmação são previstos; o esperado é verificável, mas “único” exige comparar identificadores, não apenas ver um número. | RF002, RF003, HU002; diagrama 03 e tela 04. | E1–E4 distinguem **antes/depois**, vínculo com a mesma demanda e unicidade no universo observado; não exigem máscara de protocolo. |
| **CT-02** Relato incompleto | **CORRIGIR** | A IA presumiu endereço **obrigatório para toda reclamação** e inventou a mensagem **“Endereço obrigatório”**. O RF002 não lista campos por categoria nem textos de erro. | RF002; ciclo “Faltam dados obrigatórios?” no fluxo 04. | A entrada não descreve **qual problema** ou **qual atendimento**; espera-se pedido de esclarecimento e ausência de formalização, sem frase ou campo obrigatório inventado. |
| **CT-03** Ajuste da proposta | **MANTER** | A revisão pré-aprovação está documentada. A proposta inicial não detalhava **referências antigas** derivadas do endereço, o que permitiria resultado ambíguo. Esse é um refinamento de entrada e oráculo, não uma nova regra. | RF009/RNF007; loop de revisão no diagrama 03; tela 03. | A instrução revoga **explicitamente** Rua 10 e a referência antiga; E1–E4 verificam todos os campos correntes, preservação dos fatos e ausência de registro. |
| **CT-04** Destino do órgão | **CORRIGIR** | A IA misturou sugestão de órgão com **encaminhamento concluído**. Mostrar SEINFRA na ficha não comprova que RF010 foi atendido. | RF008 e RF010; catálogo; interface do servidor em diagrama 02 e tela 06. | Novo cenário independente **lixo/COMURG**; além de classificar e registrar, comprova que o **mesmo protocolo** é consultável no órgão destinatário. Leitura da fila apenas como verificação de saída do registro. |
| **CT-05** Fidelidade | **CORRIGIR** | A IA exigiu **palavras idênticas**, mas RF009/RNF007 permitem reescrita que preserva fatos e sentido. Um esperado genérico também seria difícil de avaliar. | RF009, RNF007, HU007; tela 03. | Critérios F1–F6 exigem preservar problema, local, **negação**, **incerteza** e solicitação, sem inventar causas/datas/vítimas. Não exige cópia textual. |
| **CT-06** Gravidade | **CORRIGIR** | Inventou gravidade necessariamente **CRITICA** e prazo **24 horas**, apesar de RF016 não fixar classe nem permitir SLA sem regra oficial. | RF016, HU014; ordem do diagrama 03. | Antes/depois da aprovação; um de quatro rótulos, justificativa e eventual caráter provisório identificado; sem classe ou prazo fixos. Exige cuidado para não inferir execução interna a partir só da tela. |

**Resultado da revisão:** **2 MANTER, 4 CORRIGIR e 0 EXCLUIR**. Todos os IDs CT-01 a CT-06 foram preservados. As observações já presentes na primeira versão foram mantidas como parte do texto original e **não substituem** esta análise fundamentada.

## 3.2 Conferência dos elementos exigidos pela professora

| Elemento | Método de conferência | Resultado |
|---|---|---|
| **Pré-condições** | Distinguir proposta não aprovada, sessão nova, perfil acadêmico e fonte necessária para verificar o órgão. | CT-01 a CT-08 explicitam estados relevantes; não assumem gov.br real. |
| **Dados de entrada** | Usar relato literal, objetivo e sintético para tornar observável a situação. | Casos cobrem relato completo, vago, correção, limpeza/lixo, fidelidade e semáforo; exemplos são fictícios. |
| **Passos** | Reproduzir caminhos previstos nas telas e no diagrama de sequência. | Ações declaradas; CT-04 limita acesso do servidor à consulta da demanda recém-registrada. |
| **Resultado esperado** | Dividir em condições verificáveis com fonte, evitando oráculos que dependem de opinião não especificada. | E1–E4/E5 e F1–F6; sem mensagens literais inventadas, máscara ou nível de gravidade arbitrário. |
| **Alternativas negativas** | Cobrir insuficiência, correção, cancelamento e repetição, sem duplicar o objetivo de cada caso. | CT-02, 03, 07 e 08 com justificativas distintas. |
| **Valores-limite** | Aplicar somente onde existe fronteira definida nos artefatos. | **Não se fabricaram limites numéricos**. As fronteiras funcionais previstas são **antes/depois da confirmação**, **informação suficiente/insuficiente** e **mesma confirmação/novo registro**. |
| **Lacunas de especificação** | Não fechar lacunas por suposição da IA. | Campos obrigatórios, critérios de gravidade, comprovação do destino e detalhes de cancelamento aparecem em 05. |

## 3.3 Crítica concreta e aprendizado com IA

A primeira proposta da IA apresentava especificações aparentemente objetivas, mas algumas **não derivavam dos artefatos**: endereço universalmente obrigatório, mensagem literal, identidade textual do resumo, gravidade CRITICA e SLA de 24 horas. Além disso, confundiu **sugestão de destino** com **disponibilidade da demanda ao setor**, o que comprometeria a avaliação de RF010. **Ter um resultado testável não basta: é necessário que ele seja devido ao requisito.**

Os documentos decisivos para a correção foram **RF002** (completude sem lista de campos), **RF009/RNF007** (fidelidade semântica), **RF010** (definição de encaminhamento concluído), **RF016** (classificação posterior à aprovação e sem prazo não oficial), o catálogo e os diagramas/telas que mostram revisão, cancelamento, registro e consulta do servidor.

**Melhoria sugerida à especificação, sem alterar requisitos nesta atividade:** explicitar em uma revisão futura quais informações são obrigatórias por tipo de reclamação e como comprovar o encaminhamento e a correção de campos relacionados na proposta. Isso permitiria definir oráculos mais estritos sem inventar comportamentos.

## 3.4 Evidências de execução posterior e limite metodológico

Uma campanha de execução foi publicada em [execucao/RELATORIO_FINAL.md](execucao/RELATORIO_FINAL.md): **7 casos aprovados e CT-03 reprovado** para a **versão anterior** do arquivo final. A execução **não era exigida** pelo enunciado e **não reclassifica** as decisões MANTER/CORRIGIR dos seis casos iniciais. O defeito do CT-03 motivou a redação mais inequívoca do seu oráculo, mas **não houve reexecução da versão aprimorada**. Os casos CT-04 e CT-06 também receberam novas massas de teste; seus resultados antigos não podem ser reaproveitados como veredito da revisão atual.

**Autoria dos complementares:** CT-07 e CT-08 foram propostos com apoio de IA e **mantidos por decisão expressa do integrante em 17/11/2026**. Seu registro está em [05_rastreabilidade_e_decisoes.md](05_rastreabilidade_e_decisoes.md).