# Especificação de Requisitos do GovResolve

**Projeto:** GovResolve-MVP  
**Disciplina:** Engenharia de Software (BCC / INF-UFG)  
**Equipe:** Grupo 10 (Ctrl+Z)  
- Eduardo Fraga Pereira (202405847)  
- Ralph dos Reis Torres (202406925)  
- Samuel Amorim Jaime (202205559)  
- Wender Viana Faria Santos (202401832)  

---

## 1. Requisitos Funcionais (RF)

| ID | Nome | Descrição |
|---|---|---|
| **RF001** | Autenticação do cidadão | O cidadão poderá autenticar-se utilizando sua conta gov.br. A autenticação permitirá identificar o responsável pelo registro e controlar o acesso às suas demandas. |
| **RF002** | Registro de demanda | O cidadão poderá registrar uma demanda relacionada a um serviço público, descrevendo a situação e o atendimento solicitado. Antes de concluir o registro, a plataforma verificará o preenchimento das informações obrigatórias. |
| **RF003** | Geração de protocolo | Cada demanda registrada receberá um protocolo único, apresentado ao cidadão após a confirmação do registro, permanecendo associado à mesma demanda durante todo o atendimento. |
| **RF004** | Acompanhamento da demanda | O cidadão poderá consultar suas demandas utilizando o protocolo e visualizar o status atual de cada atendimento (acesso restrito às demandas autorizadas). |
| **RF005** | Notificação de alteração de status | Cada alteração efetivada no status de uma demanda gerará uma notificação por e-mail para o cidadão responsável pelo registro, com protocolo e novo status. |
| **RF006** | Identificação da forma de atendimento | A IA analisará o conteúdo da demanda para identificar se o serviço pode ser realizado pelo próprio cidadão (autoatendimento) ou se exige atuação de um servidor público. |
| **RF007** | Orientação para autoatendimento | Quando o serviço puder ser realizado pelo próprio cidadão, a plataforma apresentará instruções e o link da página governamental correspondente. |
| **RF008** | Classificação da demanda | As demandas que exigirem atuação de servidor público serão classificadas com auxílio de IA conforme as categorias de atendimento adotadas pelo órgão. |
| **RF009** | Organização das informações | A IA organizará as informações da demanda para facilitar a compreensão pelo servidor responsável, preservando fatos e o sentido original do relato. |
| **RF010** | Encaminhamento ao setor responsável | Demandas para atuação pública serão encaminhadas ao setor competente. O encaminhamento é concluído quando a demanda estiver disponível para consulta pelo setor destinatário. |
| **RF011** | Consulta das demandas pelo servidor | O servidor autorizado poderá visualizar as demandas incluídas em seu escopo de atendimento (protocolo, conteúdo, classificação e status). |
| **RF012** | Atualização do status | O servidor autorizado poderá atualizar o status das demandas seguindo o fluxo obrigatório: `ABERTO → EM ANDAMENTO → FECHADO`. |
| **RF013** | Controle de acesso | Funcionalidades de tratamento são restritas aos servidores autorizados. O perfil de cidadão não permite acessar o módulo de tratamento nem alterar status. |
| **RF014** | Registro e comunicação da conclusão | Ao fechar uma demanda, o servidor registrará o resultado do atendimento, disponibilizado na consulta e enviado na notificação de fechamento. |
| **RF015** | Avaliação do atendimento | O cidadão poderá enviar feedback/avaliação sobre o atendimento recebido em demanda de sua autoria. |

---

## 2. Requisitos Não Funcionais (RNF)

| ID | Nome | Categoria | Descrição |
|---|---|---|---|
| **RNF001** | Proteção de dados pessoais | Segurança / LGPD | Os dados pessoais tratados deverão ser protegidos em conformidade com a LGPD. Dados pessoais de um cidadão não poderão ser disponibilizados a outro. |
| **RNF002** | Acessibilidade | Usabilidade | As interfaces deverão atender às diretrizes WCAG 2.1, nível AA (teclado, contraste, leitor de telas). |
| **RNF003** | Tempo de confirmação do registro | Desempenho | Confirmação de salvamento apresentada em até 3 segundos após envio válido. O processamento assíncrono por IA não bloqueia esta confirmação. |
| **RNF004** | Disponibilidade | Confiabilidade | Disponibilidade mínima de 99,9% das funcionalidades essenciais de registro, consulta e tratamento. |
| **RNF005** | Prazo das notificações | Desempenho / Integração | Notificação por e-mail deve chegar ao cidadão em até 1 hora após a alteração de status. |
| **RNF006** | Confiabilidade do encaminhamento | Confiabilidade | Indicação de encaminhamento concluído somente quando disponível ao setor de destino. Em caso de falha, demanda permanece intacta. |
| **RNF007** | Fidelidade das informações da IA | Integridade dos Dados | O conteúdo organizado pela IA deve preservar estritamente fatos e sentido, sem acréscimos, distorções ou conclusões não fundamentadas no relato. |

---

## 3. Histórias de Usuário (HU)

- **HU001 — Autenticar-se na plataforma (Cidadão):** Acessar via gov.br para vincular identificação às demandas.
- **HU002 — Registrar uma demanda (Cidadão):** Registrar solicitação e receber protocolo único imediato.
- **HU003 — Consultar o andamento (Cidadão):** Consultar demanda por protocolo e visualizar status atualizado.
- **HU004 — Receber notificações de andamento (Cidadão):** Receber e-mail a cada mudança de status da demanda.
- **HU005 — Receber orientação de autoatendimento (Cidadão):** Obter links e orientações quando o serviço não exigir intervenção de servidor.
- **HU006 — Consultar a classificação da demanda (Servidor):** Visualizar categorias identificadas pela IA para a demanda.
- **HU007 — Consultar as informações organizadas (Servidor):** Acessar resumo estruturado e fiel dos fatos relatados.
- **HU008 — Ter a demanda encaminhada (Cidadão):** Demanda direcionada com segurança ao setor governamental competente.
- **HU009 — Consultar as demandas de trabalho (Servidor):** Listagem e filtros das demandas do seu departamento.
- **HU010 — Atualizar o status do atendimento (Servidor):** Avançar status exclusivamente pelo fluxo `ABERTO → EM ANDAMENTO → FECHADO`.
- **HU011 — Restringir as operações de tratamento (Servidor):** Garantir controle estrito de perfis (RBAC).
- **HU012 — Receber a conclusão do atendimento (Cidadão):** Obter parecer e resultado final ao encerramento da demanda.
- **HU013 — Avaliar o atendimento recebido (Cidadão):** Enviar nota e comentário sobre o atendimento recebido.
