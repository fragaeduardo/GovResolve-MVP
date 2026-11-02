# GovResolve - Conferência após atualização local

**Data:** 28/10/2026. O repositório local foi atualizado por fast-forward para a `main` publicada, commit `8794ee39d1bbe4e5abe2162c8ccf2b5feb797149`, de 23/10/2026. As alterações locais foram preservadas e conciliadas. Não foi feito push.

## Integração realizada

- Cópia recuperável anterior: stash `bb421699b833d073756ca41d5885c845ac41f872`.
- Catálogo de 12 órgãos com código estável e migrações da versão publicada.
- Sessões vinculadas ao cidadão, histórico mantido pelo servidor e gravação JSON atômica.
- Confirmação com checagem de proprietário e versão; persistência do texto exato da ficha e idempotência por chave única da sessão.
- Perfis fictícios explícitos, escolha do órgão do servidor e restrição de acesso. Um servidor sem órgão não recebe uma fila global.
- Revisão da Ouvidoria e atribuição de destino pelo gestor integradas à interface atual.
- Preservados: roteamento contextual em duas etapas, ficha conversacional, revisão em loop, orientação sem protocolo e ausência de e-mail.
- Removido da tela de protocolo um prazo fixo sem regra oficial; ela mostra gravidade e justificativa.

## Material de apresentação

Os diagramas e a matriz representam esta versão local integrada. Os arquivos 01-03 são gerados por PlantUML. A prévia 04 preserva o layout Graphviz aprovado; seu `.dot` permite reproduzi-lo e o PlantUML equivalente permanece disponível. O documento consolidado reproduz os mesmos blocos individuais.

Os PDFs de UML e UX/UI reúnem equipe, sistema, diagramas, fluxo, telas reais do MVP, rastreabilidade, ferramentas e prompts de consolidação. As capturas foram feitas com dados fictícios em banco isolado. As respostas de coleta e a ficha foram preparadas para ilustrar os estados da interface, sem executar o modelo de linguagem. A demonstração ao vivo fica a cargo da equipe.

## Verificações executadas

- Compilação das fontes PlantUML e inspeção visual das imagens.
- TypeScript e build de produção do frontend.
- 18 testes direcionados: contrato do roteador, destino permitido, resposta inválida do modelo, link de catálogo, sessão privada, proposta obsoleta, ficha exata, confirmação duplicada, perfis de demonstração, escopo por órgão e revisão humana.
- API local iniciada para captura, com 12 órgãos, usando banco temporário separado.
- Conferência de identificadores RF001-RF016, fontes consolidadas e links locais.

Não foram executadas a suíte legada inteira, chamadas ao modelo real, medição de latência, auditoria de segurança ou certificação de acessibilidade. Há testes e um benchmark determinístico antigos que ainda pressupõem a arquitetura anterior; sua pontuação não mede a classificação contextual atual.

O protótipo é acadêmico, não possui integração operacional gov.br ou com os órgãos municipais e não oferece SLA oficial. As mudanças integradas ainda são alterações locais não publicadas. O link local só funciona onde o MVP estiver em execução; não representa hospedagem pública.
