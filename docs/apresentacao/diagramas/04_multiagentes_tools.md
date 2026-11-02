# GovResolve — Fluxo Multiagente e Ferramentas

**Versão:** protótipo local revisado em 28/10/2026; diferenças com a `main` remota na [conferência](06_conferencia.md).

**Foco:** triagem, decisão do cidadão e registro da demanda. **Requisitos:** RF002, RF006–RF010, RF016.

```plantuml
@startuml
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontSize 16
skinparam activityFontSize 16
skinparam activityBackgroundColor #EAF3FF
skinparam activityBorderColor #326A9B
skinparam activityDiamondBackgroundColor #FFF2D5
skinparam activityDiamondBorderColor #BA8B2E
skinparam ArrowColor #56718A
skinparam noteBackgroundColor #F3FAF5
skinparam noteBorderColor #65A77A

title GovResolve | Triagem e registro com aprovação

start
:Cidadão relata a necessidade;
:Planner coordena a sessão;
:DepartmentRoutingAgent interpreta
a intenção pelo contexto;

while (Intenção ficou clara?) is (não)
  :Agente Conversacional dialoga
com o cidadão;
  :DepartmentRoutingAgent reavalia
a intenção;
endwhile (sim)

if (O cidadão quer registrar reclamação?) then (sim)
  :Coletor atualiza a ficha
com o relato do cidadão;
else (orientação)
  :Apresenta instruções e link
oficial cadastrado;
  stop
endif

while (Faltam dados obrigatórios?) is (sim)
  :Agente Conversacional pergunta;
  :Cidadão complementa;
  :Coletor de Estado atualiza sessão;
endwhile (não)

:DepartmentRoutingAgent sugere órgão
com base na ficha completa;
while (Órgão identificado com confiança?) is (não)
  :Agente Conversacional coleta
detalhe com o cidadão;
  :Coletor atualiza a ficha e DepartmentRoutingAgent
reavalia o órgão;
endwhile (sim)

:Agente de Confirmação prepara resumo;
while (Cidadão aprova a ficha?) is (não)
  :Cidadão diz o que quer
corrigir na conversa;
  :Agente Conversacional acolhe
e aprofunda o relato;
  :Coletor atualiza a ficha;
  :DepartmentRoutingAgent revê
o órgão sugerido;
  :Agente de Confirmação apresenta
a nova versão da ficha;
endwhile (sim)

:Agente de Formalização valida
cidadão, ficha e versão;
:Classificador de Gravidade avalia
o impacto após aprovação;
#DFF5E9:Tool RegistrarDemanda cria
a reclamação e o protocolo;
:Cidadão recebe o protocolo;

stop
@enduml
```

**Como explicar:** a IA primeiro identifica se a pessoa quer orientação ou quer reclamar. Orientação leva ao serviço oficial sem abrir protocolo. Na reclamação, a ficha vai sendo montada durante a conversa; só quando está completa a IA sugere o órgão. Se houver dúvida, pergunta e volta à ficha. O cidadão pode rejeitar a proposta e continuar conversando; só a aprovação aciona a formalização, a classificação de gravidade e a ferramenta de registro. O risco descrito fica na ficha para a triagem municipal, sem encaminhamento automático a um serviço de emergência.

**Fonte da prévia:** o SVG aprovado é gerado por Graphviz a partir de `04_multiagentes_tools.dot`, preservando a distribuição ajustada. O bloco PlantUML acima é uma representação editável equivalente do fluxo e pode ser distribuído de outra forma pelo renderizador. Como exceção ao fluxo principal mostrado, um pedido explícito de análise humana pode gerar uma ficha para revisão de destino pela Ouvidoria. O gestor então atribui o órgão na área de Gestão.

No SVG, `StateCollector` abrevia `DeterministicStateCollector`; a tool corresponde a `DemandRegistrationTool`, de nome `register_demand`. O classificador de gravidade é `SeverityClassificationAgent`.
