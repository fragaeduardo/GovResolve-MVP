# Checkpoint 3 — Oficina de Teste de Software com IA

**Projeto:** GovResolve-MVP | **Grupo:** Ctrl+Z (Grupo 10) | **Disciplina:** Engenharia de Software, BCC/UFG  
**Modalidade:** projeto e revisão de testes funcionais de caixa-preta; **sem execução**.

## Entrega

Esta pasta contém os artefatos de uma única funcionalidade: **registro de reclamação pública pelo chatbot, da descrição à confirmação e geração de protocolo**. A oficina exige seis casos inicialmente gerados com IA, revisão crítica individual, dois casos complementares e **oito casos finais**, com matriz de rastreabilidade. A entrega formal ao Checkpoint 3 é **um PDF**, produzido a partir desses arquivos.

| Arquivo | Conteúdo |
|---|---|
| [01_artefatos_e_escopo.md](01_artefatos_e_escopo.md) | Identificação, recorte, requisitos, histórias, UML, telas e síntese em cinco linhas |
| [02_seis_casos_gerados_ia.md](02_seis_casos_gerados_ia.md) | Briefing e primeira versão, **não revisada**, de seis casos |
| [03_revisao_critica.md](03_revisao_critica.md) | Avaliação individual: MANTER/CORRIGIR/EXCLUIR, evidência e justificativa |
| [04_oito_casos_finais.md](04_oito_casos_finais.md) | Seis casos revisados e dois complementares revisados pelo integrante: CT-07 e CT-08 mantidos |
| [05_rastreabilidade_e_decisoes.md](05_rastreabilidade_e_decisoes.md) | Matriz requisito-caso, crítica concreta à IA, pendências, decisões e reflexão |
| [ENTREGA_CHECKPOINT3.pdf](ENTREGA_CHECKPOINT3.pdf) | Documento consolidado para revisão e apresentação |

**Fontes institucionais:** [enunciado da atividade](https://docs.google.com/document/d/1xD2cu0jp7f6ROX9VbzRxE_ixNVH68iYh/edit) e material da aula “Teste de Software: fundamentos e aplicação” (Profa. Juliana Pereira de Souza-Zinader).

## Decisões de escopo

- **Somente uma funcionalidade.** Não incluir fila do servidor, acompanhamento, feedback, dashboard ou benchmark de precisão de IA como casos adicionais.
- **Nenhum novo RF, HU, critério de aceitação ou mensagem obrigatória.** Fontes normativas: documentos e artefatos já existentes no projeto; divergências são registradas como pendências.
- **Seis casos iniciais preservados antes da revisão.** Suposições indevidas aparecem somente nessa etapa como material a ser criticado. Elas **não** são adotadas nos casos finais.
- **Dois casos complementares:** cancelamento antes da formalização e confirmação repetida, fundamentados nos protótipos e no diagrama de sequência. Foram propostos com apoio de IA e, em 17/11/2026, ambos foram revisados pelo integrante solicitante com decisão **MANTER**. A decisão é documental, não resultado de execução.
- **Nenhuma execução requerida.** Não reportar PASSOU/FALHOU, acurácia, latência, tokens ou percentuais de sucesso; são especificações de testes, não seus resultados.
- **Dados fictícios.** Nenhuma chave, CPF verdadeiro, senha ou credencial deve constar nos documentos.

## Conferências antes da apresentação

1. Os dois casos complementares foram revisados e mantidos pelo integrante em 17/11/2026; conferir o conjunto completo dos oito casos com os demais integrantes antes da entrega.
2. Conferir divergências de campos obrigatórios e estados de registro sinalizadas em 05.
3. Revisar paginação/diagramação do PDF e assegurar que a versão final contém os itens exigidos no enunciado.

**Nota:** a suíte automática anterior de 61 casos, sua planilha e o arquivo ZIP foram retirados da árvore atual do repositório. Seus commits históricos não foram reescritos; o código e os benchmarks independentes do GovResolve foram preservados.