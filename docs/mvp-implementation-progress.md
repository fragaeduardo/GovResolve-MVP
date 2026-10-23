# GovResolve — progresso da evolucao do MVP

> Implementação revisada para integração na main por solicitação do mantenedor. A validação integrada do novo modo demo e migração de dados ainda depende de testes locais.

## Implementado nesta branch

### P0: isolamento, identidade e configuracao
- Login de demonstracao nao altera perfis nem cria servidores/gestores a pedido do cliente.
- Servidores preexistentes exigem `DEMO_STAFF_ACCESS_CODE` definido no ambiente.
- `SECRET_KEY` de JWT deixa de ter valor inseguro embutido; tamanho minimo de 32 caracteres.
- Acesso de servidor a demandas e estatisticas limitado a seu `department_id`. Comparativo global apenas para gestor.
- CORS restrito a `CORS_ORIGINS`; `OMNIROUTE_API_KEY` e senha PostgreSQL saem do codigo/configuracao fixa.
- `.env.example` atualizado; `.env` ignorado por Git; `.dockerignore` evita copiar segredos em imagens.
- Seed deixa de promover automaticamente perfis legados a servidor.

### P1: fluxo de agentes confiavel
- Planner preserva historico no servidor; ignora mensagens historicas falsificadas pelo cliente.
- Sessao tem `owner_id`, confirmacao (`approved_title`/`approved_description`) e protocolo associado.
- Formalizacao exige sessao existente do mesmo cidadao, proposta completa e inalterada.
- `Demand.chat_session_id` com indice unico evita criar duas demandas da mesma confirmacao.
- Agente de confirmacao usa apenas informacoes fornecidas no relato.
- Campos obrigatorios adaptados ao tipo de servico; relato nao-local nao exige rua/bairro.
- `SemanticRoutingAgent`: fallback LLM para casos nao classificados por regras. Exige codigo do catalogo,
  confianca >= 0.75 e trecho de evidência literal do cidadao.
- Removido fallback de roteamento para o primeiro orgao quando nao ha correspondencia.
- Links de autoatendimento nao verificados foram removidos.

### P2: qualidade
- Testes novos de tentativa de privilegiar conta, escopo de orgao, sessao roubada,
  confirmacao obrigatoria e idempotencia.
- Dataset sintético **48 casos/12 orgaos** em `tests/data/triage_baseline_48.jsonl`.
- Benchmark deterministico offline com contagem de acertos e confusoes por orgao.
- Workflow GitHub Actions da branch para `pytest` e benchmark.

## Configurar o projeto

Na raiz do repositorio:

```bash
cp .env.example .env
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Coloque o resultado da linha Python em `SECRET_KEY`. Configure tambem `OMNIROUTE_API_KEY`
(com uma credencial valida do seu roteador, preferivelmente rotacionada) e
`DEMO_STAFF_ACCESS_CODE` (outro segredo de pelo menos 12 caracteres; nao versionar).
O servidor de demonstracao preexistente usa o identificador `52998224725`.
Para Docker Compose, defina tambem `POSTGRES_PASSWORD` e observe o endereco
`OMNIROUTE_DOCKER_BASE_URL` (localhost dentro do container nao e localhost do host).

```bash
python -m pip install -r infra/requirements.txt
python -m pytest -q
python -m scripts.evaluate_triage
```

O frontend roda com `cd frontend && npm install && npm run dev`, e o backend com
`uvicorn src.main:app --reload`. Reinicie os processos apos mudar `.env`.

## Validacao CI (23/10/2026)

Execucao GitHub Actions numero 16:
- Python/Pytest: **30 passaram, 1 warning**.
- Frontend: **TypeScript aprovado e build Vite aprovado**.
- Benchmark offline de regras: **48/48 (100%)** sobre relatos simples sinteticos e
  rotulados. Nao extrapolar essa taxa para relatos reais, ambiguidade ou LLM.

Link para os checks: https://github.com/fragaeduardo/GovResolve-MVP/actions/runs/39921827507

## Extensões de outubro de 2026\n\n- Login de demonstração seleciona **Cidadão, Servidor ou Gestor**; no perfil servidor seleciona um dos 12 órgãos. Habilitar apenas com `DEMO_MODE=True`, `DEBUG=True`, `ENV=development`.\n- Os destinos passaram a usar códigos persistentes: SET, SEFAZ, AGCM, SEMASDH e CMTC; iluminação pública vai para SEINFRA.\n- Demandas sem órgão aguardam **revisão da Ouvidoria**, com atribuição somente pelo Gestor.\n- O workflow `.github/workflows/mvp-checks.yml` foi removido para interromper execuções e notificações automáticas. Testar manualmente antes de novos merges.\n- Os resultados CI registrados abaixo são do commit **anterior** à integração das mudanças de modo demonstrativo e catálogo; não são prova de teste das alterações mais recentes.\n\n## Limites e proximos incrementos

1. Autenticacao do cidadao continua **simulada**, sem identidade verificada/gov.br.
   **Nao e adequado para dados reais nem para publicacao aberta na internet**.
2. Sessao de chat ainda persiste em arquivos JSON locais (agora com dono/gravacao atomica).
   Avaliar migrar para a base e transacoes por sessao para concorrencia real.
3. Triagem semantica utiliza LLM apenas quando a regra deterministica nao encontra orgao,
   nao substitui avaliacao de ambiguidade/confianca em todos os casos.
4. O dataset de 48 exemplos e um **smoke baseline sintetico**, nao um benchmark
   validado de desempenho real. Ampliar para 100–200 relatos diversos, incluir corrigibilidade,
   ambiguidade, fidelidade factual, recusas e orientacoes de emergencia.
5. O escopo ainda nao inclui integracao oficial, observabilidade profunda, comparativo
   entre frameworks, PDDL, escala, ajuste fino de frontend ou publicacao em producao.
6. Os checks automatizados passaram nesta branch, mas ainda falta um teste manual completo
   cidadao/servidor/gestor com OmniRoute e PostgreSQL/SQLite reais.
7. A credencial OmniRoute estava em commits anteriores: remove-la do HEAD nao apaga
   o historico. Rotacione a credencial antiga.

## Criterios de aceite

- Nenhum usuario vira servidor enviando `role=servidor` sem prova de autorizacao.
- Servidor nao enxerga nem atualiza demandas fora de seu departamento.
- Um usuario nao pode acessar sessao de outro ou formalizar sem aprovacao.
- Repeticao de confirmacao retorna o mesmo protocolo e so ha um registro no banco.
- Nenhuma demanda e encaminhada a orgao arbitrario por falha na classificacao.
- O benchmark offline fornece resultado reproduzivel sem depender de LLM.
- Testes e frontend/build passam em ambiente limpo antes do merge.
