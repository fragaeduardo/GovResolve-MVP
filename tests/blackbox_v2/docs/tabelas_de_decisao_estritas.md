# Tabelas de decisão — derivadas somente de regras existentes

## TD-01 — Acesso ao módulo de tratamento (RF011/RF013)

| Perfil | Demanda no escopo do servidor? | Pode tratar? |
|---|---|---|
| Cidadão | Qualquer | Não |
| Servidor autorizado | Sim | Sim |
| Servidor | Não | Não |

**Fonte:** `docs/especificacao-requisitos.md`, RF011 e RF013. O teste não presume status HTTP específico.

## TD-02 — Avanço de estado e conclusão (RF012/RF014)

| Estado atual | Estado solicitado | Resultado de atendimento informado? | Regra de saída |
|---|---|---|---|
| ABERTO | EM ANDAMENTO | Não exigido pela transição | Permitida |
| ABERTO | FECHADO | Qualquer | Não permitida (salto) |
| EM ANDAMENTO | FECHADO | Sim | Permitida; resultado disponibilizado ao cidadão |
| EM ANDAMENTO | FECHADO | Não | Não concluir sem registrar resultado |
| FECHADO | EM ANDAMENTO | Qualquer | Não permitida (retrocesso) |

**Fonte:** `docs/especificacao-requisitos.md`, RF012 e RF014.

## TD-03 — Natureza da solicitação (RF006/RF007/RF008)

| Tipo reconhecido no relato | Comportamento exigido |
|---|---|
| Autoatendimento | Apresentar orientações e link governamental pertinente |
| Atendimento público | Organizar e classificar para setor competente |
| Intenção ambígua | Pedir esclarecimentos (regra de negócio já escrita na arquitetura) |

**Fontes:** RF006, RF007, RF008; `docs/arquitetura.md`, seção 4.

## TD-04 — Aprovação da proposta (regra já existente de Human-in-the-Loop)

| Ficha pronta | Aprovação humana | Comportamento |
|---|---|---|
| Não | Não | Solicitar dados faltantes |
| Sim | Não | Apresentar/revisar proposta, sem formalização |
| Sim | Sim | Formalizar demanda e emitir protocolo |

**Fontes:** `docs/arquitetura.md`, seção 4; RF002, RF003, RF016. Não são exigidas versões numéricas ou códigos HTTP.

## TD-05 — Avaliação (RF015)

| Demanda é de autoria do cidadão? | Pode enviar avaliação? |
|---|---|
| Sim | Sim, sobre atendimento recebido |
| Não | Não |

**Fonte:** RF015. O RF **não** determina nota 1–5, limite de caracteres, atualização de avaliações ou proibição expressa de avaliar antes do estado FECHADO; essas regras não foram inventadas.
