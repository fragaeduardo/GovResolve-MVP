# Destinos e categorias de triagem — GovResolve MVP

> **Projeto acadêmico / catálogo demonstrativo de Goiânia.** Os destinos abaixo servem para
> simular uma triagem. Não constituem integração com atendimento oficial.
> Fontes verificadas em outubro de 2026:
> - https://www.goiania.go.gov.br/servicos/
> - https://www.goiania.go.gov.br/secretaria/secretaria-municipal-de-engenharia-de-transito/
> - https://www.goiania.go.gov.br/secretaria/secretaria-municipal-de-politicas-para-as-mulheres-assistencia-social-e-direitos-humanos/
> - https://www.goiania.go.gov.br/secretaria/secretaria-municipal-de-infraestrutura-e-servicos-publicos/superintendencia-de-obras-e-servicos-publicos/
> - https://www.goiania.go.gov.br/html/gabinete_civil/sileg/dados/legis/2003/lo_20030103_000008148.html

## Regra de projeto: categoria diferente de órgão

O cidadão relata um problema; a triagem identifica primeiro sua **categoria** e então sugere um
**órgão de destino**. O banco usa `departments.code` estável: nomes podem mudar sem alterar
o vínculo dos protocolos.

| Código do destino | Organização de referência | Exemplos de categorias |
|---|---|---|
| SEINFRA | Secretaria Municipal de Infraestrutura Urbana | Pavimentação, bueiros, **iluminação pública** |
| COMURG | Companhia de Urbanização de Goiânia | Limpeza de ruas, lixo, poda e áreas públicas |
| SMS | Secretaria Municipal de Saúde | UBS, medicamentos, vacinação, vigilância |
| SET | Secretaria Municipal de Engenharia de Trânsito | Semáforos, sinalização, faixas de pedestres |
| AMMA | Agência Municipal do Meio Ambiente | Poluição sonora, fiscalização e denúncias ambientais |
| SEFAZ | Secretaria Municipal da Fazenda | IPTU, ISS, certidões e tributos |
| SME | Secretaria Municipal de Educação | Creches, merenda, infraestrutura escolar |
| SANEAGO | Companhia de Saneamento | Vazamentos, água, esgoto |
| AGCM | Agência da Guarda Civil Metropolitana de Goiânia | Patrulhamento, patrimônio público, vandalismo |
| PROCON | PROCON Municipal — Defesa do Consumidor | Cobranças indevidas e práticas abusivas |
| SEMASDH | Secretaria Municipal de Políticas para as Mulheres, Assistência Social e Direitos Humanos | Assistência, acolhimento e direitos humanos |
| CMTC | Companhia Metropolitana de Transportes Coletivos | Linhas, horários, itinerários e qualidade dos ônibus |

## Casos não classificados

A Ouvidoria funciona como **fila de revisão**, não como 13º órgão. O cidadão pode escrever
`encaminhar para ouvidoria` quando a triagem não reconhece seu problema. A confirmação
gera protocolo com `department_id=NULL`. O gestor vê esses casos em **Revisão da Ouvidoria**,
pode examinar o relato e atribuir um dos 12 destinos. O servidor não tem acesso à fila geral.

## Atualização de registros anteriores

Na inicialização, registros legados mantêm o mesmo identificador de departamento quando o
nome muda: `SMM -> SET`, `SEFIN -> SEFAZ`, `GCM -> AGCM`, `SEMAS -> SEMASDH`.
As demandas antigas do destino separado de iluminação pública são migradas para a
`SEINFRA` antes da exclusão desse destino. A atualização é idempotente.

## Limites do MVP

A correspondência entre um relato e um órgão pode exigir informações adicionais e revisão
humana. O catálogo não é suficiente para afirmar cobertura percentual sobre todas as
reclamações reais, especialmente serviços estaduais e federais. Não apresentar contatos
fictícios de `data/departments.jsonl` como endereços oficiais de atendimento.
