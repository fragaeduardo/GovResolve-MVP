# GovResolve — testes funcionais de caixa-preta (V2 estrita)

**Este pacote substitui o anterior.** Foi auditado contra RF/HU e regras de negócio já documentadas no GitHub, **sem acrescentar novos requisitos**.

- 61 casos de teste mantidos e revisados, todos com fundamentação textual e arquivo de origem.
- 37 casos excluídos da suíte estrita, documentados na auditoria dos 98.
- Critérios exclusivamente técnicos (códigos HTTP, tamanho de campos, paginação, escala de feedback, regex de protocolo) foram removidos das obrigações quando ausentes dos requisitos.
- RF005 e HU004: notificações por e-mail removidas do escopo; não testar como obrigação.
- RF001 gov.br real é futuro; perfis demo não comprovam autenticação gov.br.
- Nenhum caso foi executado contra sistema nesta revisão.

Arquivos:

* `casos_de_teste_estritos.xlsx`: matriz de casos com fontes literais, rastreabilidade e auditoria.
* `casos_de_teste_estritos.csv` e `.json`: casos em formatos intercambiáveis.
* `auditoria_98_casos.csv`: decisão item a item dos 98 casos originais.
* `rastreabilidade_estrita.csv`: mapa RF001–RF016 × casos mantidos.
* `docs/casos_de_teste_estritos.md`: detalhes e justificativas.
* `docs/plano_de_testes_estrito.md`: escopo, técnicas, evidências e lacunas.
* `docs/tabelas_de_decisao_estritas.md`: combinações de regras existentes.
* `tests/blackbox/test_contratos_http.py`: subconjunto de testes HTTP seguros e compatíveis com os critérios funcionais definidos; sem depender de funções internas.

**Nota:** códigos HTTP usados na automação são interface de transporte, não são promovidos a novos requisitos de negócio. Um caso passa se o comportamento exigido for observado. Sem instância, os testes são pulados.

## Duas camadas, sem confundir requisitos

- **Núcleo de 38 casos — `somente_RF_HU_RNF.csv`:** usa apenas RF/HU/RNF preexistente como fundamento do resultado esperado. É a seleção mais conservadora para apresentação de testes de aceitação estritamente baseados na especificação.
- **23 casos complementares — `regras_ja_documentadas_complementares.csv`:** dependem também de regras já existentes na arquitetura, catálogo e observação MVP; **não** constituem RFs novos. A equipe deve confirmar se esses documentos contam como critérios de aceite antes de somá-los à cobertura formal.
- **37 descartados:** não entram em nenhum dos dois conjuntos.
