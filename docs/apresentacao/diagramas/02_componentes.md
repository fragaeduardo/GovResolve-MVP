# GovResolve — Diagrama de Componentes

**Foco:** módulos ativos, interfaces HTTP e dependências da versão local do protótipo. Revisado em 28/10/2026; consulte a [conferência com o GitHub](06_conferencia.md).

```plantuml
@startuml
top to bottom direction
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontName DejaVu Sans
skinparam defaultFontSize 15
skinparam componentStyle uml2
skinparam componentBackgroundColor #F1F7FC
skinparam componentBorderColor #326A9B
skinparam packageBackgroundColor #FAFCFE
skinparam packageBorderColor #C1D0DF
skinparam ArrowColor #58718A
skinparam databaseBackgroundColor #EAF7EF
skinparam databaseBorderColor #36865B
skinparam interfaceBackgroundColor #FFF4DB
skinparam interfaceBorderColor #BA8B2E
skinparam nodesep 60
skinparam ranksep 45
skinparam roundcorner 10


package "Interface React" {
  component "Portal do Cidadão\nconversa e protocolos" as Citizen
  component "Portal do Servidor\nfila e tratamento" as Staff
  component "Área de Gestão\nindicadores e revisão" as Management
  Citizen -[hidden]right- Staff
  Staff -[hidden]right- Management
}

interface "REST cidadão" as CitizenAPI
interface "REST equipe" as StaffAPI
component "API GovResolve\nFastAPI, JWT e perfis" as API #E6F0FA
Citizen ..> CitizenAPI : utiliza
Staff ..> StaffAPI : utiliza
Management ..> StaffAPI : utiliza
API -left- CitizenAPI
API -right- StaffAPI

package "Serviços da aplicação" {
  component "Atendimento inteligente\nPlanner e agentes" as AI
  component "Serviço de demandas\nDemandService" as Demands
}

component "Modelo de linguagem\nAPI configurada" as LLM #FFF4DB
artifact "Sessões em JSON\nSessionStore" as Memory #EAF7EF
database "Banco relacional\ndemandas, histórico e avaliações\nusuários, papéis e órgãos" as DB

API .down.> AI : conversa e confirmação
API .down.> Demands : consulta e tratamento
AI ..> LLM : interpretação contextual
AI ..> Memory : lê e atualiza a sessão
AI .right.> Demands : tool de registro\napós confirmação
Demands .down.> DB : consulta e persiste
LLM -[hidden]right- Memory
Memory -[hidden]right- DB
@enduml
```

**Como explicar:** os três ambientes usam a API. O atendimento inteligente monta a ficha e, depois da confirmação, usa `DemandRegistrationTool` para chamar `DemandService`. As conversas ficam em arquivos JSON; os registros e seus históricos ficam no banco relacional. Os círculos representam interfaces HTTP fornecidas pela API, não classes `IAtendimento` ou `ITratamento` existentes no código.

A autenticação e as dependências de autorização fazem parte da API. O login é demonstrativo, sem integração gov.br. A IA usa a API de modelo configurada. A revisão manual da Ouvidoria foi integrada à área de Gestão: o gestor consulta a fila sem órgão e atribui um destino pelas rotas administrativas. O envio de notificações por e-mail permanece removido.

| Interface fornecida | Rotas HTTP |
|---|---|
| REST cidadão | `/demands`: conversa, confirmação, protocolos e avaliação |
| REST equipe | `/admin`: fila, tratamento e revisão; `/management`: indicadores de gestão |

A autenticação usa `/auth`. A API e o serviço de demandas consultam os registros de usuários conforme as dependências de acesso; o desenho omite conexões de leitura repetidas para destacar o fluxo principal.
