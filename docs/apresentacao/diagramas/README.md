# GovResolve — Diagramas para apresentação

**Equipe:** Grupo 10 — Ctrl+Z. **Disciplina:** Engenharia de Software. **Revisão:** 28/10/2026.

Os desenhos foram revisados com o código, os requisitos e as telas locais. A `main` do [GitHub](https://github.com/fragaeduardo/GovResolve-MVP/commit/8794ee39d1bbe4e5abe2162c8ccf2b5feb797149) ainda está no commit `8794ee39`, de 23/10. A base publicada foi integrada ao repositório local, preservando as melhorias do protótipo. Essas melhorias ainda não foram publicadas; os diagramas representam o estado local integrado. A [conferência](06_conferencia.md) registra as diferenças e os limites observados.

| Diagrama | Fonte e explicação | SVG para ampliar | PNG para slides |
|---|---|---|---|
| 01 — Classes | [Fonte](01_classes.md) | [SVG](01_classes.svg) | [PNG](01_classes.png) |
| 02 — Componentes | [Fonte](02_componentes.md) | [SVG](02_componentes.svg) | [PNG](02_componentes.png) |
| 03 — Sequência | [Fonte](03_sequencia.md) | [SVG](03_sequencia.svg) | [PNG](03_sequencia.png) |
| 04 — Multiagentes | [Fonte](04_multiagentes_tools.md) | [SVG](04_multiagentes_tools.svg) | [PNG](04_multiagentes_tools.png) |

A [matriz de rastreabilidade](05_matriz_rastreabilidade.md) relaciona RF001–RF016 aos elementos UML e às telas atuais. O [documento consolidado](GovResolve_Diagramas_Engenharia_de_Software.md) reúne as mesmas fontes individuais.

## Para apresentar

Use os SVGs quando a ferramenta aceitar imagens vetoriais; os PNGs são alternativas com fundo branco opaco. Ambos podem ser usados em slides claros ou escuros sem perder o contraste do desenho. O SVG mantém a definição ao ampliar.

O desenho 04 explica o fluxo geral. O 01 mostra as entidades e operações; o 02, os módulos e interfaces; o 03, a ordem das interações do registro. A sequência foi condensada em um quadro horizontal: um ciclo de construção e revisão, seguido da aprovação, gravidade e registro. Os detalhes dos ciclos ficam no desenho 04.

A notação foi mantida: compartimentos e multiplicidades nas classes; componentes e interfaces fornecidas na arquitetura; linhas de vida, mensagens, retornos e fragmentos `loop` na sequência. Métodos e nomes de código foram reduzidos ao necessário para justificar o funcionamento.

## Fontes e exportação

Os arquivos 01–03 contêm blocos PlantUML que geraram diretamente seus SVGs e PNGs. Os quatro blocos PlantUML foram compilados na revisão. O SVG 04 preserva o layout aprovado e é reproduzido pela fonte [Graphviz DOT](04_multiagentes_tools.dot); o PlantUML 04 representa o mesmo fluxo com outra distribuição.

Todos os SVGs têm fundo branco opaco cobrindo o canvas inteiro. O material foi inspecionado visualmente após a exportação. Foram executados build e verificações direcionadas da integração; as capturas usam um cenário acadêmico e não substituem a demonstração ao vivo.

A atividade também solicita PDFs com identificação da equipe, diagramas, matriz, ferramentas e prompts usados. Os PDFs finais estão na subpasta `entrega`. A navegação ao vivo será demonstrada pela equipe no MVP.
