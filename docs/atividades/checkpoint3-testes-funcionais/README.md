# Checkpoint 3 — Oficina de Teste de Software com IA

**Projeto:** GovResolve-MVP | **Grupo:** Ctrl+Z (Grupo 10) | **Disciplina:** Engenharia de Software, BCC/UFG  
**Modalidade da entrega formal:** projeto e revisão de testes funcionais de caixa-preta. A execução posterior está registrada em [execucao/RELATORIO_FINAL.md](execucao/RELATORIO_FINAL.md).

## Entrega

Esta pasta contém os artefatos de uma única funcionalidade: **registro de reclamação pública pelo chatbot, da descrição à confirmação e geração de protocolo**. A oficina exige seis casos inicialmente gerados com IA, revisão crítica individual, dois casos complementares e **oito casos finais**, com matriz de rastreabilidade. A entrega formal ao Checkpoint 3 é **um PDF**, produzido a partir desses arquivos.

| Arquivo | Conteúdo |
|---|---|
| [01_artefatos_e_escopo.md](01_artefatos_e_escopo.md) | Identificação, recorte, requisitos, histórias, UML, telas e síntese em cinco linhas |
| [02_seis_casos_gerados_ia.md](02_seis_casos_gerados_ia.md) | Briefing e primeira versão, **não revisada**, de seis casos |
| [03_revisao_critica.md](03_revisao_critica.md) | Revisão crítica individual dos seis casos, justificativas e melhorias |
| [04_oito_casos_finais.md](04_oito_casos_finais.md) | **Versão aprimorada** dos oito casos: oráculos identificados, entradas controladas e fontes por caso |
| [05_rastreabilidade_e_decisoes.md](05_rastreabilidade_e_decisoes.md) | Matriz requisito-caso, crítica concreta à IA, pendências, decisões e reflexão |
| [ENTREGA_CHECKPOINT3.pdf](ENTREGA_CHECKPOINT3.pdf) | **PDF consolidado atualizado** para revisão e apresentação do Checkpoint 3 |
| [extras/](extras/README.md) | **CT-09 e CT-10: dois testes extras opcionais**, separados dos oito casos oficiais e **não executados** |

**Fontes institucionais:** [enunciado da atividade](https://docs.google.com/document/d/1xD2cu0jp7f6ROX9VbzRxE_ixNVH68iYh/edit) e material da aula “Teste de Software: fundamentos e aplicação” (Profa. Juliana Pereira de Souza-Zinader).

## Decisões de escopo

- **Somente uma funcionalidade.** O objeto segue sendo o registro e encaminhamento da demanda pelo chatbot. A consulta **somente-leitura** da fila no CT-04 é a evidência exigida por RF010; não se testa processamento do servidor, acompanhamento, feedback, dashboard ou benchmark de IA.
- **Nenhum novo RF, HU, critério de aceitação ou mensagem obrigatória.** Fontes normativas: documentos e artefatos já existentes no projeto; divergências são registradas como pendências.
- **Seis casos iniciais preservados antes da revisão.** Suposições indevidas aparecem somente nessa etapa como material a ser criticado. Elas **não** são adotadas nos casos finais.
- **Dois casos complementares:** cancelamento antes da formalização e confirmação repetida, fundamentados nos protótipos e no diagrama de sequência. Foram propostos com apoio de IA e, em 17/11/2026, ambos foram revisados pelo integrante solicitante com decisão **MANTER**. A decisão é documental, não resultado de execução.
- **Escopo da entrega formal:** só projeto e revisão, **sem obrigação de execução**. A campanha de 17/11/2026 está isolada em [execucao/RELATORIO_FINAL.md](execucao/RELATORIO_FINAL.md) e se refere à **versão anterior dos casos**, não à versão aprimorada deste checkpoint.
- **Dados fictícios.** Nenhuma chave, CPF verdadeiro, senha ou credencial deve constar nos documentos.

## Conferências antes da apresentação

1. Os dois casos complementares foram revisados e mantidos pelo integrante em 17/11/2026; conferir o conjunto completo dos oito casos com os demais integrantes antes da entrega.
2. Conferir divergências de campos obrigatórios e estados de registro sinalizadas em 05.
3. Conferir a apresentação do PDF; o documento deve conter os seis casos originais, revisão individual, oito casos finais, matriz e análise crítica.

**Nota:** a suíte automática anterior de 61 casos, sua planilha e o arquivo ZIP foram retirados da árvore atual do repositório. Seus commits históricos não foram reescritos; o código e os benchmarks independentes do GovResolve foram preservados.

## Execução posterior

Em 17/11/2026, os oito casos finais foram executados em sequência no MVP, com dados fictícios e banco de testes isolado. Resultado observado: **7 aprovados e 1 reprovado (CT-03)**. A falha foi uma referência de endereço antiga mantida na ficha revisada; também foi observada divergência entre o status exibido pela tela e o retornado pela API/banco. Consulte o [relatório final e as evidências selecionadas](execucao/RELATORIO_FINAL.md).

A publicação inclui relatórios individuais, resultados estruturados sanitizados e capturas da interface. O banco SQLite, os logs brutos e as credenciais permanecem locais.


## Aprimoramento dos casos — 17/11/2026

Os oito cenários foram preservados e os **oráculos** foram tornados explícitos (E1–E5 e F1–F6). A entrada do CT-03 agora **revoga expressamente** a referência antiga; o CT-04 usa um relato distinto (**lixo/COMURG**) e exige disponibilidade efetiva na fila destinatária; o CT-05 usa uma matriz de fatos/negações/incertezas; o CT-06 separa antes/depois da aprovação sem impor gravidade. CT-07/CT-08 mantêm as decisões **MANTER** do integrante. **Nenhum requisito ou código foi modificado; a versão aprimorada não foi reexecutada.**

## Ampliação opcional — dois testes adicionais

Foram preparados **CT-09** (confirmação de proposta desatualizada) e **CT-10** (solicitação expressa de revisão humana pela Ouvidoria), em [testes_extras/](testes_extras/README.md). **São propostas ainda não executadas nem revisadas pela equipe e ficam fora dos oito casos/PDF exigidos no Checkpoint 3.** A documentação original e os resultados anteriores permanecem inalterados.
