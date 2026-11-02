# GovResolve — Diagrama de Classes

**Foco:** entidades centrais, multiplicidades e operações reais. Revisado em 28/10/2026 para a versão local do protótipo; a diferença em relação ao GitHub está na [conferência](06_conferencia.md).

```plantuml
@startuml
top to bottom direction
hide circle
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontName DejaVu Sans
skinparam defaultFontSize 15
skinparam classAttributeIconSize 0
skinparam classBackgroundColor #F2F7FC
skinparam classBorderColor #326A9B
skinparam ArrowColor #58718A
skinparam packageBackgroundColor #FAFCFE
skinparam packageBorderColor #C1D0DF
skinparam nodesep 35
skinparam ranksep 50
skinparam roundcorner 10


package "Dados do atendimento" {
  class "Usuário" as User {
    id: int
    name: str
    role: UserRole
    +get_roles(): list
    +has_role(role): bool
    +get_department_ids(): list
  }
  class "Órgão" as Department {
    id: int
    code: str?
    name: str
    description: str?
  }
  class "Demanda" as Demand {
    protocol: str
    chat_session_id: str?
    title: str
    description: str
    category: str?
    status: DemandStatus
    severity: DemandSeverity
    resolution_notes: str?
  }
  class "Histórico de situação" as StatusHistory {
    old_status: DemandStatus?
    new_status: DemandStatus
    notes: str?
    created_at: datetime
  }
  class "Avaliação" as Feedback {
    rating: int
    comment: str?
    created_at: datetime
  }
  User "0..*" -right- "0..*" Department : atua em
  User "1" -down- "0..*" Demand : registra
  Department "0..1" -down- "0..*" Demand : destino
  Demand "1" *-down- "1..*" StatusHistory : mantém
  Demand "1" -down- "0..1" Feedback : recebe
  StatusHistory -[hidden]right- Feedback
}

class DemandService <<serviço>> #E7F3EC {
  +create_demand()
  +get_demand_by_protocol()
  +update_status()
  +add_feedback()
}
DemandService .left.> Demand : registra, consulta\ne trata
@enduml
```

**Como explicar:** o usuário pode exercer vários papéis e atuar em vários órgãos. Cada demanda pertence a um cidadão, possui um destino opcional no modelo de dados, mantém histórico e pode receber uma avaliação. As operações de registro, atualização e avaliação pertencem a `DemandService`; as entidades ORM não implementam esses métodos.

| Nome no diagrama | Classe no código |
|---|---|
| Usuário | `User` |
| Órgão | `Department` |
| Demanda | `Demand` |
| Histórico de situação | `StatusHistory` |
| Avaliação | `Feedback` |

Os vínculos entre usuários e órgãos são mantidos por `user_departments`; os papéis adicionais, por `UserRoleAssignment`. O vínculo primário `User.department_id` foi preservado para compatibilidade com a versão publicada. Essas estruturas de apoio foram condensadas no desenho. A sessão fica em JSON por `SessionStore`; `Demand.chat_session_id` tem unicidade no banco, evitando dois protocolos para a mesma sessão. Demandas aprovadas para revisão humana podem permanecer sem órgão até o gestor atribuir o destino.

As operações aparecem com os parâmetros omitidos para leitura. Os atributos são uma seleção; `?` indica campo opcional. Estados: `ABERTO`, `EM ANDAMENTO` e `FECHADO`. Gravidade: `BAIXA`, `MEDIA`, `ALTA` ou `CRITICA`.
