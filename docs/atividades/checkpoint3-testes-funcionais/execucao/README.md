# Execução funcional — 17/11/2026

Esta pasta reúne o relatório final da execução real dos casos CT-01 a CT-08, seus relatórios individuais e evidências selecionadas. A campanha usou sessões novas, dados fictícios e banco SQLite isolado, conforme documentado no relatório.

Os arquivos `result.json` preservam o esperado, observado, passos, verificações, problemas e métricas de cada caso, sem IDs de sessão. `http-summary.json` registra método, rota, código HTTP e campos de resposta necessários à revisão, sem tokens, dados do cidadão ou conteúdo integral dos relatos. As capturas PNG e extrações TXT mostram as interações na interface.

Os artefatos brutos — `.env`, credenciais, banco SQLite, linhas de seed, logs completos, memória de sessão, requisições/respostas integrais e runtime local — não fazem parte desta publicação. Os totais agregados estão em [database-summary.json](database-summary.json); os dados de ambiente e dependências sem caminhos locais estão em [environment-summary.json](environment-summary.json) e [dependencies-summary.json](dependencies-summary.json).

O relatório contém 7 casos aprovados e 1 reprovado (CT-03). A campanha foi concluída sobre o commit `8e058e8e8bf883fbf19b92db8d8e350fa5042d92`; a publicação deste material é documental e não altera o código da aplicação.
