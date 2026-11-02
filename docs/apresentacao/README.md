# GovResolve — materiais da apresentação

Entrega acadêmica do Grupo 10 (Ctrl+Z), prevista para 29/10/2026.

## PDFs

- [Modelagem UML](../../output/pdf/GovResolve_Modelagem_UML.pdf): classes, componentes, sequência, matriz, ferramentas, prompt consolidado e fluxo multiagente em apêndice.
- [UX/UI](../../output/pdf/GovResolve_UX_UI.pdf): público, navegação, telas reais com dados fictícios, matriz, ferramentas e prompt consolidado.

Os PDFs estão incluídos neste repositório para distribuição junto com as fontes.
As imagens têm fundo branco opaco. O fluxo multiagente foi preservado no formato aprovado e está em página A3 vertical para consulta com zoom.

## Fontes

- `diagramas/`: fontes PlantUML, imagens PNG/SVG e fonte DOT do fluxo aprovado.
- `telas/`: capturas reais em banco temporário isolado, com cenários e dados fictícios.
- [Prompts](prompts.md): instruções consolidadas e pedidos do usuário. Não são apresentados como transcrição literal de um único prompt histórico.
- [Gerador](gerar_pdfs.py): usa Python com ReportLab, Pillow e pypdf instalados, além de DejaVu Sans em `/usr/share/fonts/truetype/dejavu`.

Para regenerar: `python docs/apresentacao/gerar_pdfs.py`, na raiz do projeto. O gerador reutiliza as imagens; não atualiza capturas automaticamente.

## Demonstração no MVP

O PDF aponta para **http://localhost:5173**. Esse endereço funciona no computador que executa o MVP; não é um link público acessível ao professor em outro computador. Para avaliação remota, será necessário informar um endereço de demonstração acessível e atualizar o PDF.

1. Inicie o provedor de IA configurado no `.env` e o backend: `.venv/bin/python -m uvicorn src.main:app --host 127.0.0.1 --port 8000`.
2. Em outro terminal, execute `npm run dev -- --host 127.0.0.1 --port 5173`, dentro de `frontend/`.
3. Abra o endereço local e escolha o perfil de cidadão. Use dados fictícios.
4. Converse, complete a ficha, solicite um ajuste, confira a nova versão e confirme. Consulte o protocolo.
5. Alterne para servidor do órgão responsável e mostre a fila e a atualização de status. Depois, mostre gestão e revisão de destino.

Sugestão para 20 minutos: sistema (2), classes (4), componentes (3), sequência (3), MVP (6), matriz e fechamento (2). Os dois PDFs são apoio; a equipe conduz a navegação ao vivo.

## Estado verificado

Base local: `main` em `8794ee39`, com melhorias locais não publicadas. Backup anterior preservado no stash `bb42169`.

Passaram 18 testes direcionados, TypeScript e build Vite. Houve navegação de captura em ambiente isolado e confirmação real via interface. As fichas foram preparadas com dados fictícios; o LLM estava desativado nas capturas. A classificação de gravidade provisória exibida é uma condição real de indisponibilidade, não uma avaliação do modelo.

Não foram medidos acurácia, latência, disponibilidade ou conformidade WCAG. A suíte legada completa e o fluxo ao vivo com o provedor real não foram validados.
