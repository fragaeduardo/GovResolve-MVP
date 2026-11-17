# GovResolve — Casos de Teste Funcionais (caixa-preta, versão estrita)

> Esta versão NÃO cria requisitos. Cada caso contém sua fonte textual original, extraída das especificações existentes no GitHub.
> **Nenhum teste funcional foi executado contra o GovResolve nesta revisão.** Todos os estados permanecem NÃO EXECUTADO.

**61 casos mantidos e revisados**; 37 excluídos por falta de base normativa suficientemente explícita. Consulte `auditoria_98_casos.csv`.

## Escopo de rastreabilidade

- Requisitos funcionais RF001–RF016 e histórias de usuário já existentes em `docs/especificacao-requisitos.md`.
- Regras de negócio **já escritas** em `docs/arquitetura.md`, `docs/orgaos-competentes.md` e `docs/backlog-moscow.md` podem fundamentar cenários, sem criar RF novo.
- `RF005` (notificações por e-mail) permanece fora do escopo; `RF001` gov.br real não está implementado no MVP, e acesso demonstrativo não valida autenticação oficial.
- Não usar valores-limite numéricos retirados apenas de Pydantic/FastAPI como se estivessem na especificação. Não usar HTTP 401/403/404/422 específicos como critério obrigatório se o RF não fixar esse protocolo.

## Casos

### Identidade

#### CT-AUT-01 — Acessar como cidadão demonstrativo
- **RF/HU associado:** RF013.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** DEMO_MODE=True; ENV=development; DEBUG=True.
- **Dados:** role=cidadao.
- **Passos:** Abrir tela inicial; escolher Cidadão; acessar portal.
- **Resultado esperado:** Sessão demonstrativa com permissões de cidadão; sem funcionalidades de tratamento..
- **Fundamentação documental (trecho ou resumo do texto já existente):** Observação do MVP: Nesta versão acadêmica, existe um modo de demonstração controlado por configuração, com três perfis: Cidadão, Servidor vinculado a órgão e Gestor. | RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-AUT-02 — Acessar como servidor de órgão no modo demonstração
- **RF/HU associado:** RF011; RF013.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Modo demonstração habilitado; catálogo populado.
- **Dados:** role=servidor; department_id válido.
- **Passos:** Escolher Servidor e um órgão; entrar.
- **Resultado esperado:** Servidor demonstrativo vinculado ao órgão selecionado consulta somente demandas de seu escopo..
- **Fundamentação documental (trecho ou resumo do texto já existente):** Observação do MVP: Nesta versão acadêmica, existe um modo de demonstração controlado por configuração, com três perfis: Cidadão, Servidor vinculado a órgão e Gestor. | RF011: O servidor autorizado poderá visualizar as demandas incluídas em seu escopo de atendimento (protocolo, conteúdo, classificação e status). | RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-AUT-03 — Servidor sem vínculo não obtém acesso a demandas de outros órgãos
- **RF/HU associado:** RF011; RF013.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Servidor de teste sem vínculo a órgão; demandas pertencentes a outros órgãos.
- **Dados:** identidade de servidor sem vínculo com os órgãos do cenário.
- **Passos:** Tentar consultar a fila e os protocolos de órgãos aos quais o servidor não está autorizado..
- **Resultado esperado:** A ausência de vínculo não autoriza visualizar nem tratar demandas de órgãos externos ao escopo do servidor..
- **Fundamentação documental (trecho ou resumo do texto já existente):** Observação do MVP: Nesta versão acadêmica, existe um modo de demonstração controlado por configuração, com três perfis: Cidadão, Servidor vinculado a órgão e Gestor. | RF011: O servidor autorizado poderá visualizar as demandas incluídas em seu escopo de atendimento (protocolo, conteúdo, classificação e status). | RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-AUT-05 — Acessar perfil Gestor demonstrativo
- **RF/HU associado:** Regra de negócio já documentada (sem RF específico).
- **Técnica:** Particionamento. **Prioridade:** P1.
- **Pré-condições:** Modo demonstração habilitado.
- **Dados:** role=gestor, sem department_id.
- **Passos:** Escolher Gestor; abrir painel.
- **Resultado esperado:** Gestor demonstra capacidade de acessar a fila de revisão de demandas sem órgão, já prevista no catálogo do MVP..
- **Fundamentação documental (trecho ou resumo do texto já existente):** Observação do MVP: Nesta versão acadêmica, existe um modo de demonstração controlado por configuração, com três perfis: Cidadão, Servidor vinculado a órgão e Gestor. | Casos não classificados: O cidadão pode escrever encaminhar para ouvidoria. A confirmação gera protocolo sem departamento; gestor vê casos em Revisão da Ouvidoria e pode atribuir um dos 12 destinos..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/orgaos-competentes.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-AUT-06 — Solicitar papel administrativo sem autorização
- **RF/HU associado:** RF013.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Login simulado de desenvolvimento habilitado; identidade sintética não administrativa.
- **Dados:** role=servidor; sem código.
- **Passos:** POST /auth/login solicitando papel servidor.
- **Resultado esperado:** A solicitação de papel não concede permissões de servidor a quem não está autorizado..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-AUT-08 — Impedir consulta de demandas sem autenticação
- **RF/HU associado:** RF013.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** API inicializada.
- **Dados:** sem Authorization.
- **Passos:** GET /api/v1/demands/my.
- **Resultado esperado:** A consulta a demandas privadas não retorna dados sem a autenticação exigida para o MVP..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status. | Exclusões de escopo: Registro ou envio anônimo / não autenticado estão fora do escopo..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/backlog-moscow.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-AUT-09 — Impedir acesso com credencial de autenticação inválida
- **RF/HU associado:** RF013.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** API inicializada.
- **Dados:** Authorization: Bearer token-invalido.
- **Passos:** GET /api/v1/auth/me.
- **Resultado esperado:** Uma credencial inválida não permite acessar informações de perfil protegido..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-AUT-10 — Cidadão não recebe permissões de tratamento
- **RF/HU associado:** RF013.
- **Técnica:** Caso de uso. **Prioridade:** P1.
- **Pré-condições:** Cidadão demonstrativo autenticado.
- **Dados:** token cidadao.
- **Passos:** GET /api/v1/auth/me; conferir áreas.
- **Resultado esperado:** O cidadão pode utilizar sua área, mas não recebe acesso de servidor/gestor para tratar demandas..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

### Registro

#### CT-REG-01 — Registrar demanda após fluxo de aprovação
- **RF/HU associado:** RF002; RF003.
- **Técnica:** Caso de uso. **Prioridade:** P0.
- **Pré-condições:** Cidadão autenticado; provedor IA disponível.
- **Dados:** Relato sintético de buraco em rua + localização.
- **Passos:** Conversar; completar dados; revisar; aprovar; confirmar.
- **Resultado esperado:** Depois de completar as informações obrigatórias e aprovar a proposta, o cidadão recebe protocolo associado à demanda..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF002: Antes de concluir o registro, a plataforma verificará o preenchimento das informações obrigatórias. | RF003: Cada demanda registrada receberá um protocolo único, apresentado ao cidadão após a confirmação do registro, permanecendo associado à mesma demanda durante todo o atendimento. | Seção 4, arquitetura multiagente: Quando a ficha está completa, DepartmentRoutingAgent sugere órgão do catálogo; ConfirmationAgent apresenta ficha e órgão para aprovação ou revisão em conversa. | Seção 4, aprovação humana: Após a confirmação, o agente registra a reclamação e o protocolo..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-REG-02 — Solicitar dados obrigatórios ausentes
- **RF/HU associado:** RF002.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Cidadão em nova conversa.
- **Dados:** "Tem um bueiro entupido" sem endereço.
- **Passos:** Iniciar chat e aguardar resposta.
- **Resultado esperado:** Quando faltam informações obrigatórias para concluir o registro, o sistema solicita complementação antes de registrar..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF002: Antes de concluir o registro, a plataforma verificará o preenchimento das informações obrigatórias. | Seção 4, arquitetura multiagente: Quando a ficha está completa, DepartmentRoutingAgent sugere órgão do catálogo; ConfirmationAgent apresenta ficha e órgão para aprovação ou revisão em conversa..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-REG-03 — Saudação isolada não registra demanda
- **RF/HU associado:** RF002.
- **Técnica:** Particionamento. **Prioridade:** P1.
- **Pré-condições:** Cidadão em nova conversa.
- **Dados:** "Oi, bom dia".
- **Passos:** Enviar saudação no chat.
- **Resultado esperado:** Sem relato de uma demanda e informações obrigatórias, não ocorre registro nem emissão de protocolo..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF002: Antes de concluir o registro, a plataforma verificará o preenchimento das informações obrigatórias..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-REG-11 — Impedir registro não autenticado
- **RF/HU associado:** RF002.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Sem token.
- **Dados:** title/description válidos.
- **Passos:** POST /api/v1/demands.
- **Resultado esperado:** O registro anônimo/não autenticado não é concluído..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF002: Antes de concluir o registro, a plataforma verificará o preenchimento das informações obrigatórias. | Exclusões de escopo: Registro ou envio anônimo / não autenticado estão fora do escopo..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/backlog-moscow.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-REG-12 — Recusar registro incompleto
- **RF/HU associado:** RF002.
- **Técnica:** Particionamento. **Prioridade:** P1.
- **Pré-condições:** Cidadão autenticado.
- **Dados:** body={} / title ausente / description ausente.
- **Passos:** Tentar concluir registro sem informações obrigatórias identificadas para o fluxo..
- **Resultado esperado:** A ausência de informação obrigatória impede a conclusão do registro; nenhuma demanda incompleta é formalizada..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF002: Antes de concluir o registro, a plataforma verificará o preenchimento das informações obrigatórias..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

### Protocolos

#### CT-PRO-01 — Exibir protocolo único após o registro
- **RF/HU associado:** RF003.
- **Técnica:** Caso de uso. **Prioridade:** P0.
- **Pré-condições:** Demanda validamente criada.
- **Dados:** protocolo retornado após o registro válido.
- **Passos:** Ler protocolo retornado.
- **Resultado esperado:** A demanda concluída apresenta ao cidadão seu protocolo; o teste não exige máscara, prefixo ou comprimento não previstos no RF003..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF003: Cada demanda registrada receberá um protocolo único, apresentado ao cidadão após a confirmação do registro, permanecendo associado à mesma demanda durante todo o atendimento..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-PRO-02 — Gerar protocolos diferentes para demandas distintas
- **RF/HU associado:** RF003.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Cidadão autenticado; ambiente isolado.
- **Dados:** duas reclamações diferentes.
- **Passos:** Registrar duas demandas distintas.
- **Resultado esperado:** Cada demanda distinta recebe um identificador único, sem colisão..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF003: Cada demanda registrada receberá um protocolo único, apresentado ao cidadão após a confirmação do registro, permanecendo associado à mesma demanda durante todo o atendimento..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-PRO-03 — Manter a associação do protocolo durante o atendimento
- **RF/HU associado:** RF003; RF004.
- **Técnica:** Caso de uso. **Prioridade:** P0.
- **Pré-condições:** Demanda registrada e autorizada.
- **Dados:** protocolo existente.
- **Passos:** Consultar; servidor atualizar; consultar novamente.
- **Resultado esperado:** O mesmo protocolo continua a identificar a mesma demanda durante as atualizações, refletindo o status atual..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF003: Cada demanda registrada receberá um protocolo único, apresentado ao cidadão após a confirmação do registro, permanecendo associado à mesma demanda durante todo o atendimento. | RF004: O cidadão poderá consultar suas demandas utilizando o protocolo e visualizar o status atual de cada atendimento (acesso restrito às demandas autorizadas)..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-PRO-04 — Consultar identificador que não corresponde a demanda existente
- **RF/HU associado:** RF004.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Cidadão autenticado.
- **Dados:** identificador não associado a nenhuma demanda na base isolada.
- **Passos:** GET /api/v1/demands/{protocol}.
- **Resultado esperado:** Não deve ser apresentada uma demanda diferente como se correspondesse ao protocolo informado..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF004: O cidadão poderá consultar suas demandas utilizando o protocolo e visualizar o status atual de cada atendimento (acesso restrito às demandas autorizadas)..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-PRO-05 — Consultar andamento de demanda própria
- **RF/HU associado:** RF004.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Cidadão A tem demanda criada.
- **Dados:** token A; protocolo de A.
- **Passos:** GET /api/v1/demands/{protocol}.
- **Resultado esperado:** O cidadão autorizado consulta a demanda associada ao protocolo e visualiza o status atualizado..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF004: O cidadão poderá consultar suas demandas utilizando o protocolo e visualizar o status atual de cada atendimento (acesso restrito às demandas autorizadas)..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-PRO-06 — Impedir consulta de demanda alheia
- **RF/HU associado:** RF004; RNF001.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Cidadãos A e B distintos; A registrou demanda.
- **Dados:** token B; protocolo de A.
- **Passos:** GET /api/v1/demands/{protocol}.
- **Resultado esperado:** O cidadão não obtém o conteúdo ou status de uma demanda de outro cidadão sem autorização..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF004: O cidadão poderá consultar suas demandas utilizando o protocolo e visualizar o status atual de cada atendimento (acesso restrito às demandas autorizadas). | RNF001: Dados pessoais de um cidadão não poderão ser disponibilizados a outro..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-PRO-07 — Consulta de demandas próprias preserva isolamento
- **RF/HU associado:** RF004; RNF001.
- **Técnica:** Caso de uso. **Prioridade:** P1.
- **Pré-condições:** A possui demanda, B possui demanda.
- **Dados:** token de B.
- **Passos:** GET /api/v1/demands/my.
- **Resultado esperado:** Um cidadão não recebe na consulta demandas de outra pessoa..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF004: O cidadão poderá consultar suas demandas utilizando o protocolo e visualizar o status atual de cada atendimento (acesso restrito às demandas autorizadas). | RNF001: Dados pessoais de um cidadão não poderão ser disponibilizados a outro..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

### Triagem por IA

#### CT-CHAT-01 — Apresentar orientação de autoatendimento
- **RF/HU associado:** RF006; RF007.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Provedor de IA funcional; opções curadas.
- **Dados:** "Como emitir certidão de IPTU?".
- **Passos:** Iniciar conversa com dúvida de autoatendimento.
- **Resultado esperado:** A IA reconhece autoatendimento, fornece instruções e link governamental correspondente e não inicia autuação administrativa desnecessária..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF006: A IA analisará o conteúdo da demanda para identificar se o serviço pode ser realizado pelo próprio cidadão (autoatendimento) ou se exige atuação de um servidor público. | RF007: Quando o serviço puder ser realizado pelo próprio cidadão, a plataforma apresentará instruções e o link da página governamental correspondente. | Fluxo da mensagem: Orientação segue ao serviço oficial sem abrir protocolo..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-02 — Não criar URLs governamentais fictícias
- **RF/HU associado:** RF007.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Catálogo de links válidos configurado.
- **Dados:** Dúvida sobre serviço fora de links cadastrados.
- **Passos:** Solicitar serviço sem link cadastrado.
- **Resultado esperado:** O fluxo não apresenta como oficial um link não existente no catálogo curado de autoatendimento..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF007: Quando o serviço puder ser realizado pelo próprio cidadão, a plataforma apresentará instruções e o link da página governamental correspondente. | Seção 4, links curados: Os links e instruções de autoatendimento são conteúdo curado em SELF_SERVICE_OPTIONS; a IA decide qual opção se aplica, mas não cria links..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-03 — Reconhecer demanda que exige atuação pública
- **RF/HU associado:** RF006; RF008.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Provedor de IA funcional.
- **Dados:** "Há vazamento de água na Rua Exemplo 120, Setor Alfa".
- **Passos:** Enviar relato; complementar se necessário.
- **Resultado esperado:** O relato é tratado como demanda de atendimento público, com organização e classificação para encaminhamento..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF006: A IA analisará o conteúdo da demanda para identificar se o serviço pode ser realizado pelo próprio cidadão (autoatendimento) ou se exige atuação de um servidor público. | RF008: As demandas que exigirem atuação de servidor público serão classificadas com auxílio de IA conforme as categorias de atendimento adotadas pelo órgão. | Seção 4, arquitetura multiagente: Quando a ficha está completa, DepartmentRoutingAgent sugere órgão do catálogo; ConfirmationAgent apresenta ficha e órgão para aprovação ou revisão em conversa..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-04 — Classificar relato de vazamento conforme catálogo
- **RF/HU associado:** RF008; RF010.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Proposta completa; IA habilitada.
- **Dados:** vazamento de água; localização fictícia.
- **Passos:** Completar ficha; revisar órgão sugerido.
- **Resultado esperado:** A demanda relativa à concessionária de água/esgoto é direcionada ao destino SANEAGO, previsto no catálogo demonstrativo..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF008: As demandas que exigirem atuação de servidor público serão classificadas com auxílio de IA conforme as categorias de atendimento adotadas pelo órgão. | RF010: Demandas para atuação pública serão encaminhadas ao setor competente. O encaminhamento é concluído quando a demanda estiver disponível para consulta pelo setor destinatário. | Tabela de destinos: SANEAGO — Vazamentos, água, esgoto..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/orgaos-competentes.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-05 — Classificar iluminação pública conforme catálogo
- **RF/HU associado:** RF008; RF010.
- **Técnica:** Tabela de decisão. **Prioridade:** P1.
- **Pré-condições:** Proposta completa; IA habilitada.
- **Dados:** poste sem iluminação em via fictícia.
- **Passos:** Completar ficha e consultar destino sugerido.
- **Resultado esperado:** A demanda de iluminação pública é categorizada sob o órgão SEINFRA, conforme o catálogo demonstrativo..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF008: As demandas que exigirem atuação de servidor público serão classificadas com auxílio de IA conforme as categorias de atendimento adotadas pelo órgão. | RF010: Demandas para atuação pública serão encaminhadas ao setor competente. O encaminhamento é concluído quando a demanda estiver disponível para consulta pelo setor destinatário. | Tabela de destinos: SEINFRA — Pavimentação, bueiros, iluminação pública..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/orgaos-competentes.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-06 — Preservar fatos na organização do relato
- **RF/HU associado:** RF009.
- **Técnica:** Caso de uso. **Prioridade:** P0.
- **Pré-condições:** Provedor IA disponível.
- **Dados:** "Poste apagado há 3 dias na Rua A, próximo à escola".
- **Passos:** Iniciar chat e concluir proposta.
- **Resultado esperado:** O resumo preserva os fatos informados, sem distorcer datas, locais ou sentido..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF009: A IA organizará as informações da demanda para facilitar a compreensão pelo servidor responsável, preservando fatos e o sentido original do relato..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-07 — Não acrescentar fatos ausentes ao resumo
- **RF/HU associado:** RF009.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Relato fictício sem bairro/número.
- **Dados:** "Há lixo acumulado perto da praça".
- **Passos:** Pedir resumo preliminar.
- **Resultado esperado:** A organização do relato não inclui informações inventadas ou conclusões sem fundamento no texto do cidadão..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF009: A IA organizará as informações da demanda para facilitar a compreensão pelo servidor responsável, preservando fatos e o sentido original do relato..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-08 — Não registrar demanda antes da aprovação da proposta
- **RF/HU associado:** RF002.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Sessão completa aguardando confirmação.
- **Dados:** proposta válida, mas não confirmar.
- **Passos:** Consultar /demands/my antes da aprovação.
- **Resultado esperado:** Sem aprovação da proposta do fluxo conversacional documentado, não há autuação oficial nem protocolo de registro..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF002: Antes de concluir o registro, a plataforma verificará o preenchimento das informações obrigatórias. | Seção 4, aprovação humana: Após a confirmação, o agente registra a reclamação e o protocolo..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-09 — Corrigir informações antes de aprovar a proposta
- **RF/HU associado:** RF009.
- **Técnica:** Caso de uso. **Prioridade:** P0.
- **Pré-condições:** Sessão aguardando confirmação.
- **Dados:** corrigir endereço Rua A -> Rua B.
- **Passos:** Solicitar correção factual da proposta; conferir a nova proposta antes de aprovar..
- **Resultado esperado:** Correções fornecidas pelo cidadão são refletidas na proposta antes de eventual aprovação, sem alteração inventada de fatos..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF009: A IA organizará as informações da demanda para facilitar a compreensão pelo servidor responsável, preservando fatos e o sentido original do relato. | Seção 4, arquitetura multiagente: Quando a ficha está completa, DepartmentRoutingAgent sugere órgão do catálogo; ConfirmationAgent apresenta ficha e órgão para aprovação ou revisão em conversa..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-11 — Bloquear formalização sem aprovação no fluxo conversacional
- **RF/HU associado:** RF002.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Sessão nova sem proposta aprovada.
- **Dados:** session_id válido, sem aceite.
- **Passos:** Tentar formalizar no fluxo conversacional sem aprovação humana prévia..
- **Resultado esperado:** A demanda do fluxo conversacional não é formalizada antes da aprovação humana descrita na arquitetura..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF002: Antes de concluir o registro, a plataforma verificará o preenchimento das informações obrigatórias. | Seção 4, aprovação humana: Após a confirmação, o agente registra a reclamação e o protocolo..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-13 — Impedir acesso cruzado às informações de conversa
- **RF/HU associado:** RF004; RNF001.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Sessão criada pelo A; B autenticado.
- **Dados:** token B, session_id de A.
- **Passos:** Autenticar-se como cidadão B e tentar consultar informações de conversa do cidadão A..
- **Resultado esperado:** Outro cidadão não obtém conteúdo ou dados pessoais da conversa/demanda que pertence ao primeiro..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF004: O cidadão poderá consultar suas demandas utilizando o protocolo e visualizar o status atual de cada atendimento (acesso restrito às demandas autorizadas). | RNF001: Dados pessoais de um cidadão não poderão ser disponibilizados a outro..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-16 — Não encaminhar arbitrariamente uma demanda ambígua
- **RF/HU associado:** RF008; RF010.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** IA não consegue atribuir destino com confiança.
- **Dados:** relato sintético ambíguo.
- **Passos:** Concluir conversa solicitando revisão humana.
- **Resultado esperado:** Quando falta informação para identificar órgão competente, o sistema solicita esclarecimentos em vez de assumir destino arbitrário..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF008: As demandas que exigirem atuação de servidor público serão classificadas com auxílio de IA conforme as categorias de atendimento adotadas pelo órgão. | RF010: Demandas para atuação pública serão encaminhadas ao setor competente. O encaminhamento é concluído quando a demanda estiver disponível para consulta pelo setor destinatário. | Fluxo da mensagem: Quando há dúvida, o ConversationalAgent pede esclarecimento e o fluxo retorna à ficha ou à etapa de roteamento..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-17 — Solicitar revisão humana na fila Ouvidoria
- **RF/HU associado:** RF010.
- **Técnica:** Caso de uso. **Prioridade:** P1.
- **Pré-condições:** Cidadão com proposta não classificável.
- **Dados:** "encaminhar para ouvidoria".
- **Passos:** Solicitar revisão humana e confirmar quando permitido.
- **Resultado esperado:** Demanda elegível à revisão humana fica sem órgão e pode ser consultada na fila de revisão do gestor..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF010: Demandas para atuação pública serão encaminhadas ao setor competente. O encaminhamento é concluído quando a demanda estiver disponível para consulta pelo setor destinatário. | Casos não classificados: O cidadão pode escrever encaminhar para ouvidoria. A confirmação gera protocolo sem departamento; gestor vê casos em Revisão da Ouvidoria e pode atribuir um dos 12 destinos..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/orgaos-competentes.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-18 — Não exibir prazo sem regra oficial
- **RF/HU associado:** RF016.
- **Técnica:** Caso de uso. **Prioridade:** P1.
- **Pré-condições:** Cidadão com relato em análise.
- **Dados:** "Quando vão resolver?".
- **Passos:** Consultar classificação e explicação.
- **Resultado esperado:** Nenhum prazo é apresentado como oficial sem regra oficial cadastrada pelo órgão..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF016: Após a aprovação da proposta pelo cidadão (Human-in-the-Loop), a IA classificará contextualmente a gravidade da demanda em 4 níveis (CRITICA, ALTA, MEDIA, BAIXA) com parecer técnico justificativo. Não será exibido prazo sem regra oficial cadastrada pelo órgão..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-19 — Aproveitar informações já fornecidas na conversa
- **RF/HU associado:** RF009.
- **Técnica:** Particionamento. **Prioridade:** P1.
- **Pré-condições:** Sessão com histórico de uma ocorrência.
- **Dados:** Primeira mensagem informa local; segunda informa problema.
- **Passos:** Enviar duas mensagens na mesma sessão; revisar proposta.
- **Resultado esperado:** O sistema mantém os fatos anteriormente fornecidos e utiliza complementos sem distorção ou perda das informações..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF009: A IA organizará as informações da demanda para facilitar a compreensão pelo servidor responsável, preservando fatos e o sentido original do relato. | Seção 4, coleta progressiva: StateCollector aproveita o que o cidadão já escreveu e atualiza a ficha..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-CHAT-20 — Pedir esclarecimento diante de intenção ambígua
- **RF/HU associado:** RF006.
- **Técnica:** Particionamento. **Prioridade:** P1.
- **Pré-condições:** Cidadão autenticado.
- **Dados:** "Tenho um problema com transporte".
- **Passos:** Enviar relato insuficiente.
- **Resultado esperado:** Em caso de informação insuficiente, a IA busca esclarecimento antes de classificar ou encaminhar..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF006: A IA analisará o conteúdo da demanda para identificar se o serviço pode ser realizado pelo próprio cidadão (autoatendimento) ou se exige atuação de um servidor público. | Fluxo da mensagem: Quando há dúvida, o ConversationalAgent pede esclarecimento e o fluxo retorna à ficha ou à etapa de roteamento..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/arquitetura.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

### Atendimento

#### CT-STA-01 — Demanda ingressa no fluxo de atendimento como ABERTO
- **RF/HU associado:** RF012.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Cidadão concluiu fluxo de confirmação.
- **Dados:** registro concluído pelo fluxo conversacional vigente.
- **Passos:** Consultar status logo após confirmação.
- **Resultado esperado:** A demanda inicia o fluxo obrigatório no estado ABERTO..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF012: O servidor autorizado poderá atualizar o status das demandas seguindo o fluxo obrigatório: ABERTO → EM ANDAMENTO → FECHADO..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-STA-02 — Avançar de ABERTO para EM ANDAMENTO
- **RF/HU associado:** RF012.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Servidor do órgão responsável; demanda ABERTO.
- **Dados:** new_status="EM ANDAMENTO".
- **Passos:** PATCH /admin/demands/{p}/status.
- **Resultado esperado:** Servidor autorizado realiza a transição permitida, e o estado consultável passa a EM ANDAMENTO..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF012: O servidor autorizado poderá atualizar o status das demandas seguindo o fluxo obrigatório: ABERTO → EM ANDAMENTO → FECHADO..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-STA-03 — Concluir de EM ANDAMENTO para FECHADO com resultado
- **RF/HU associado:** RF012; RF014.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Servidor do órgão; demanda EM ANDAMENTO.
- **Dados:** new_status=FECHADO; resolution_notes adequado.
- **Passos:** PATCH /admin/demands/{p}/status.
- **Resultado esperado:** Servidor autorizado fecha a demanda registrando resultado; o cidadão consegue consultar a conclusão..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF012: O servidor autorizado poderá atualizar o status das demandas seguindo o fluxo obrigatório: ABERTO → EM ANDAMENTO → FECHADO. | RF014: Ao fechar uma demanda, o servidor registrará o resultado do atendimento, disponibilizado ao cidadão na consulta da demanda..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-STA-04 — Impedir fechamento sem resultado do atendimento
- **RF/HU associado:** RF014.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Demanda EM ANDAMENTO.
- **Dados:** new_status=FECHADO; resolution_notes ausente.
- **Passos:** PATCH /admin/demands/{p}/status.
- **Resultado esperado:** Não é possível concluir uma demanda sem registrar o resultado exigido pelo RF014..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF014: Ao fechar uma demanda, o servidor registrará o resultado do atendimento, disponibilizado ao cidadão na consulta da demanda..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-STA-05 — Parecer vazio não satisfaz o registro de conclusão
- **RF/HU associado:** RF014.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Demanda EM ANDAMENTO.
- **Dados:** resolution_notes="   ".
- **Passos:** Tentar fechar.
- **Resultado esperado:** Campo composto apenas por espaços não constitui um resultado de atendimento; a demanda não deve ser concluída sem resultado..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF014: Ao fechar uma demanda, o servidor registrará o resultado do atendimento, disponibilizado ao cidadão na consulta da demanda..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-STA-06 — Impedir salto ABERTO para FECHADO
- **RF/HU associado:** RF012.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Demanda ABERTO.
- **Dados:** new_status=FECHADO; parecer não vazio.
- **Passos:** PATCH /admin/demands/{p}/status.
- **Resultado esperado:** O salto de estado viola o fluxo obrigatório e não altera o status da demanda..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF012: O servidor autorizado poderá atualizar o status das demandas seguindo o fluxo obrigatório: ABERTO → EM ANDAMENTO → FECHADO..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-STA-07 — Impedir retrocesso EM ANDAMENTO para ABERTO
- **RF/HU associado:** RF012.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Demanda EM ANDAMENTO.
- **Dados:** new_status=ABERTO.
- **Passos:** PATCH /admin/demands/{p}/status.
- **Resultado esperado:** O retrocesso viola o fluxo obrigatório e não altera o status da demanda..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF012: O servidor autorizado poderá atualizar o status das demandas seguindo o fluxo obrigatório: ABERTO → EM ANDAMENTO → FECHADO..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-STA-08 — Impedir retorno de FECHADO para EM ANDAMENTO
- **RF/HU associado:** RF012.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Demanda FECHADO.
- **Dados:** new_status=EM ANDAMENTO.
- **Passos:** PATCH /admin/demands/{p}/status.
- **Resultado esperado:** O retorno viola o fluxo obrigatório e não altera o status da demanda..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF012: O servidor autorizado poderá atualizar o status das demandas seguindo o fluxo obrigatório: ABERTO → EM ANDAMENTO → FECHADO..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

### Permissões e filas

#### CT-ADM-01 — Cidadão não consulta o módulo de tratamento
- **RF/HU associado:** RF011; RF013.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Cidadão autenticado.
- **Dados:** token cidadão.
- **Passos:** GET /admin/demands.
- **Resultado esperado:** As demandas da fila operacional não são expostas a usuários do perfil cidadão..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF011: O servidor autorizado poderá visualizar as demandas incluídas em seu escopo de atendimento (protocolo, conteúdo, classificação e status). | RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-02 — Cidadão não altera status
- **RF/HU associado:** RF012; RF013.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Cidadão autenticado; demanda existente.
- **Dados:** token cidadão; new_status=FECHADO.
- **Passos:** PATCH /admin/demands/{p}/status.
- **Resultado esperado:** Uma tentativa feita pelo cidadão não modifica o status da demanda..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF012: O servidor autorizado poderá atualizar o status das demandas seguindo o fluxo obrigatório: ABERTO → EM ANDAMENTO → FECHADO. | RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-03 — Servidor vê apenas demandas em seu escopo
- **RF/HU associado:** RF011; RF013.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Servidor vinculado a A; demandas em A e B.
- **Dados:** token servidor A.
- **Passos:** GET /admin/demands.
- **Resultado esperado:** A listagem do servidor contém somente demandas dos órgãos sob sua autorização..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF011: O servidor autorizado poderá visualizar as demandas incluídas em seu escopo de atendimento (protocolo, conteúdo, classificação e status). | RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-04 — Servidor não acessa dossiê de órgão alheio
- **RF/HU associado:** RF011; RF013.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Servidor A autenticado; protocolo B.
- **Dados:** token A; protocolo B.
- **Passos:** GET /admin/demands/{p_B}.
- **Resultado esperado:** O servidor não consegue consultar dados de demanda de órgão não incluído em seu escopo..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF011: O servidor autorizado poderá visualizar as demandas incluídas em seu escopo de atendimento (protocolo, conteúdo, classificação e status). | RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-05 — Servidor não altera demanda de órgão alheio
- **RF/HU associado:** RF012; RF013.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Servidor A; demanda B.
- **Dados:** token A; protocolo B; novo status.
- **Passos:** PATCH /admin/demands/{p_B}/status.
- **Resultado esperado:** Servidor sem autorização para o órgão não modifica o estado de suas demandas..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF012: O servidor autorizado poderá atualizar o status das demandas seguindo o fluxo obrigatório: ABERTO → EM ANDAMENTO → FECHADO. | RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-06 — Filtro não amplia escopo de servidor
- **RF/HU associado:** RF011; RF013.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Servidor A autenticado; órgão B existe.
- **Dados:** department_id=B.
- **Passos:** GET /admin/demands?department_id=B.
- **Resultado esperado:** O uso de filtros não permite consultar demandas de órgãos fora do escopo do servidor..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF011: O servidor autorizado poderá visualizar as demandas incluídas em seu escopo de atendimento (protocolo, conteúdo, classificação e status). | RF013: Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-07 — Servidor consulta dados previstos para seu atendimento
- **RF/HU associado:** RF011.
- **Técnica:** Caso de uso. **Prioridade:** P1.
- **Pré-condições:** Demanda do setor A com histórico.
- **Dados:** token servidor A; protocolo próprio do setor.
- **Passos:** GET /admin/demands/{protocol}.
- **Resultado esperado:** Servidor autorizado visualiza protocolo, conteúdo, classificação e status da demanda de seu setor..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF011: O servidor autorizado poderá visualizar as demandas incluídas em seu escopo de atendimento (protocolo, conteúdo, classificação e status)..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-08 — Servidor utiliza filtros sobre demandas do próprio setor
- **RF/HU associado:** RF011; HU009.
- **Técnica:** Caso de uso. **Prioridade:** P1.
- **Pré-condições:** Servidor A com demandas em vários estados.
- **Dados:** status=FECHADO.
- **Passos:** GET /admin/demands?status_filter=FECHADO.
- **Resultado esperado:** Os filtros de sua fila retornam somente demandas que atendem à condição e permanecem no escopo do servidor..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF011: O servidor autorizado poderá visualizar as demandas incluídas em seu escopo de atendimento (protocolo, conteúdo, classificação e status). | HU009: Listagem e filtros das demandas do seu departamento..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-12 — Fila Ouvidoria acessível conforme regra de revisão
- **RF/HU associado:** Regra de negócio já documentada (sem RF específico).
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Servidor e gestor logados.
- **Dados:** tokens servidor/gestor.
- **Passos:** GET /admin/review com cada perfil.
- **Resultado esperado:** Gestor tem acesso à fila de revisão; servidor comum não vê a fila geral de casos sem departamento..
- **Fundamentação documental (trecho ou resumo do texto já existente):** Casos não classificados: O cidadão pode escrever encaminhar para ouvidoria. A confirmação gera protocolo sem departamento; gestor vê casos em Revisão da Ouvidoria e pode atribuir um dos 12 destinos..
- **Arquivo-fonte:** docs/orgaos-competentes.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-13 — Gestor atribui órgão cadastrado à demanda da Ouvidoria
- **RF/HU associado:** RF010.
- **Técnica:** Caso de uso. **Prioridade:** P1.
- **Pré-condições:** Gestor logado; demanda em revisão; órgão válido.
- **Dados:** department_id válido.
- **Passos:** POST /admin/review/{protocol}/assign.
- **Resultado esperado:** O gestor seleciona um dos 12 órgãos previstos e a demanda fica disponível ao setor destinatário..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF010: Demandas para atuação pública serão encaminhadas ao setor competente. O encaminhamento é concluído quando a demanda estiver disponível para consulta pelo setor destinatário. | Casos não classificados: O cidadão pode escrever encaminhar para ouvidoria. A confirmação gera protocolo sem departamento; gestor vê casos em Revisão da Ouvidoria e pode atribuir um dos 12 destinos..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/orgaos-competentes.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-ADM-15 — Não atribuir demanda da Ouvidoria a destino fora do catálogo
- **RF/HU associado:** RF010.
- **Técnica:** Particionamento. **Prioridade:** P1.
- **Pré-condições:** Gestor logado; demanda em revisão.
- **Dados:** department_id inexistente.
- **Passos:** Solicitar ao gestor encaminhamento de demanda em revisão para um órgão não cadastrado..
- **Resultado esperado:** Não é concluído encaminhamento para órgão inexistente ou não cadastrado no catálogo demonstrativo de 12 destinos..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF010: Demandas para atuação pública serão encaminhadas ao setor competente. O encaminhamento é concluído quando a demanda estiver disponível para consulta pelo setor destinatário. | Casos não classificados: O cidadão pode escrever encaminhar para ouvidoria. A confirmação gera protocolo sem departamento; gestor vê casos em Revisão da Ouvidoria e pode atribuir um dos 12 destinos..
- **Arquivo-fonte:** docs/especificacao-requisitos.md; docs/orgaos-competentes.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

### Avaliação

#### CT-FBK-02 — Cidadão avalia atendimento de demanda própria
- **RF/HU associado:** RF015; HU013.
- **Técnica:** Caso de uso. **Prioridade:** P1.
- **Pré-condições:** Cidadão dono; status FECHADO.
- **Dados:** uma nota e comentário de atendimento; sem impor escala numérica não especificada.
- **Passos:** POST /demands/{p}/feedback.
- **Resultado esperado:** O titular da demanda envia uma nota e, quando informado, comentário sobre o atendimento recebido..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF015: O cidadão poderá enviar feedback/avaliação sobre o atendimento recebido em demanda de sua autoria. | HU013: Enviar nota e comentário sobre o atendimento recebido..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-FBK-03 — Impedir avaliação de demanda alheia
- **RF/HU associado:** RF015; RNF001.
- **Técnica:** Tabela de decisão. **Prioridade:** P0.
- **Pré-condições:** Demanda encerrada de A; B autenticado.
- **Dados:** token B; rating=5; protocolo A.
- **Passos:** POST /demands/{p_A}/feedback.
- **Resultado esperado:** Uma pessoa não consegue registrar avaliação como titular de demanda que pertence a outro cidadão..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF015: O cidadão poderá enviar feedback/avaliação sobre o atendimento recebido em demanda de sua autoria. | RNF001: Dados pessoais de um cidadão não poderão ser disponibilizados a outro..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

### Gravidade

#### CT-GRV-01 — Classificar gravidade somente após a aprovação humana
- **RF/HU associado:** RF016.
- **Técnica:** Caso de uso. **Prioridade:** P0.
- **Pré-condições:** Proposta da demanda ainda não foi aprovada.
- **Dados:** relato de risco relevante.
- **Passos:** Observar antes da confirmação; confirmar; consultar demanda.
- **Resultado esperado:** A IA atribui gravidade após o cidadão aprovar a proposta..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF016: Após a aprovação da proposta pelo cidadão (Human-in-the-Loop), a IA classificará contextualmente a gravidade da demanda em 4 níveis (CRITICA, ALTA, MEDIA, BAIXA) com parecer técnico justificativo. Não será exibido prazo sem regra oficial cadastrada pelo órgão..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-GRV-02 — Utilizar somente níveis de gravidade especificados
- **RF/HU associado:** RF016.
- **Técnica:** Particionamento. **Prioridade:** P0.
- **Pré-condições:** Demanda formalizada.
- **Dados:** retorno da classificação.
- **Passos:** Consultar demanda/dossiê.
- **Resultado esperado:** O nível indicado pertence a {CRITICA, ALTA, MEDIA, BAIXA}, sem criar novos níveis..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF016: Após a aprovação da proposta pelo cidadão (Human-in-the-Loop), a IA classificará contextualmente a gravidade da demanda em 4 níveis (CRITICA, ALTA, MEDIA, BAIXA) com parecer técnico justificativo. Não será exibido prazo sem regra oficial cadastrada pelo órgão..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-GRV-03 — Indicar natureza provisória da gravidade quando aplicável
- **RF/HU associado:** RF016; HU014.
- **Técnica:** Tabela de decisão. **Prioridade:** P1.
- **Pré-condições:** Ambiente homologação com provedor IA indisponível.
- **Dados:** relato de atendimento público completo.
- **Passos:** Confirmar demanda; consultar classificação.
- **Resultado esperado:** Quando a classificação é provisória, sua condição é explicitamente indicada, conforme HU014..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF016: Após a aprovação da proposta pelo cidadão (Human-in-the-Loop), a IA classificará contextualmente a gravidade da demanda em 4 níveis (CRITICA, ALTA, MEDIA, BAIXA) com parecer técnico justificativo. Não será exibido prazo sem regra oficial cadastrada pelo órgão. | HU014: Visualizar gravidade operacional atribuída pela IA após aprovação humana, com justificativa e indicação explícita quando a classificação for provisória..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.

#### CT-GRV-04 — Exibir justificativa da gravidade
- **RF/HU associado:** RF016; HU014.
- **Técnica:** Caso de uso. **Prioridade:** P1.
- **Pré-condições:** IA disponível; demanda formalizada.
- **Dados:** relato estruturado.
- **Passos:** Consultar dossiê do servidor.
- **Resultado esperado:** A gravidade atribuída pela IA é acompanhada de parecer justificativo, conforme RF016..
- **Fundamentação documental (trecho ou resumo do texto já existente):** RF016: Após a aprovação da proposta pelo cidadão (Human-in-the-Loop), a IA classificará contextualmente a gravidade da demanda em 4 níveis (CRITICA, ALTA, MEDIA, BAIXA) com parecer técnico justificativo. Não será exibido prazo sem regra oficial cadastrada pelo órgão. | HU014: Visualizar gravidade operacional atribuída pela IA após aprovação humana, com justificativa e indicação explícita quando a classificação for provisória..
- **Arquivo-fonte:** docs/especificacao-requisitos.md.
- **Execução:** NÃO EXECUTADO; coletar resultado observado e evidência antes de declarar aprovado/reprovado.
