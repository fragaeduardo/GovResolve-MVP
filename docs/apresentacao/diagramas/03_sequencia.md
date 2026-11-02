# GovResolve — Diagrama de Sequência

**Fluxo:** registrar uma reclamação pelo chat na versão local do protótipo. **Requisitos:** RF002, RF003, RF008, RF009, RF010 e RF016. **Pré-condição:** cidadão conectado e intenção de reclamação identificada; o caminho de orientação está no diagrama 04.

```plantuml
@startuml
hide footbox
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontName DejaVu Sans
skinparam defaultFontSize 15
skinparam sequenceParticipantBackgroundColor #EAF3FF
skinparam sequenceParticipantBorderColor #326AA0
skinparam sequenceActorBorderColor #326AA0
skinparam sequenceActorBackgroundColor #EAF3FF
skinparam sequenceArrowColor #49627A
skinparam sequenceLifeLineBorderColor #ADC6DE
skinparam sequenceGroupBorderColor #8AA7C4
skinparam sequenceGroupBackgroundColor #F7FAFD
skinparam sequenceMessageAlign center
skinparam ParticipantPadding 14
skinparam ControlBackgroundColor #EAF3FF
skinparam ControlBorderColor #326AA0
skinparam BoundaryBackgroundColor #EAF3FF
skinparam BoundaryBorderColor #326AA0
skinparam BoxPadding 10


actor "Cidadão" as C
boundary "Portal do\nCidadão" as P
control "API" as API
control "Atendimento\nPlanner e agentes" as AI
participant "Tool de registro" as Tool
control "DemandService" as Service

loop Enquanto há dados faltantes ou o cidadão pede ajustes
  C -> P : relata, complementa ou corrige
  P -> API : POST /demands/chat
  API -> AI : process_citizen_chat()
  AI -> AI : coleta dados; se a ficha está completa,\nsugere órgão e prepara proposta
  AI --> API : pergunta ou nova versão da ficha
  API --> P : resposta do atendimento
  P --> C : mostra pergunta ou ficha para revisão
end

C -> P : aprova a ficha
P -> API : confirma a proposta
API -> AI : valida cidadão e versão\nformalize_and_register()
AI -> AI : classifica gravidade\nclassify_demand()
AI -> Tool : execute(dados, cidadão)
Tool -> Service : create_demand()
Service -> Service : gera protocolo e salva\ndemanda + histórico inicial
Service --> Tool : demanda criada
Tool --> AI : resultado com protocolo
AI --> API : confirmação do registro
API --> P : protocolo e dados da demanda
P --> C : exibe o protocolo
@enduml
```

**Como explicar:** a ficha é construída com o cidadão e recebe uma sugestão de órgão quando houver informações suficientes. A revisão é um ciclo: cada correção pode gerar outra proposta. A aprovação pelo botão do portal inicia a formalização; em seguida, a IA classifica a gravidade e a ferramenta chama o serviço que salva a demanda e o histórico inicial.

`Tool de registro` corresponde a `DemandRegistrationTool`. `Atendimento` reúne a fachada `AIScreeningService`, `Planner`, `ConfirmationAgent`, `FormalizationAgent` e os especialistas para reduzir o número de participantes. O fragmento `loop` reúne a coleta inicial e as correções posteriores, que passam pelo mesmo endpoint de chat. A rota completa de confirmação é `/demands/chat/{session_id}/confirm`. A confirmação valida o proprietário da sessão e a versão informada, salva a mesma ficha apresentada e usa a unicidade da sessão para repetir o protocolo em confirmações duplicadas. Essas condições foram verificadas por testes isolados; o comportamento do modelo ao vivo não foi medido nesta revisão.
