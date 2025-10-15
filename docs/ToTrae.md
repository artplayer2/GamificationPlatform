0) Contexto & Objetivo

Você (TRAE) vai assumir o desenvolvimento contínuo de uma plataforma de gamificação multi-tenant para jogos e apps (Unity, Unreal, Mobile, SaaS), com:

APIs REST, WebSocket realtime, Webhooks (HMAC + retries), Events persistidos

Isolamento por tenant e project (via x-tenant-id e projectId)

SDKs (Node, Unity, Unreal) e dashboards (Admin + Client)

Escalável (MongoDB, NestJS, cache, filas, K8s), observável, segura e idempotente

1) Instruções Iniciais (LEIA O CÓDIGO + AUDITE)

Leia todo o projeto (estrutura, módulos players, inventory/wallet, items, store, quests, counters, achievements, events, webhooks, realtime, projects, progression).

Rode local (modo dev) e documente todos os passos. Gere/atualize docs/SETUP.md e docs/ENV.md.

Audite:

Validações rígidas de tenantId e projectId (TenantProjectValidator).

Idempotência: chaves/índices (compras, wallet ops, XP grants).

RFC7807 Problem JSON uniforme.

Eventos → persistência + broadcast WS + enfileirar webhooks.

WebSocket handshake (query/headers) e subscribe ({ action: "subscribe", eventTypes: [...] }).

Cron Worker de webhooks (*/5s) e backoff exponencial.

Segurança: HMAC em webhooks, secrets, API keys, rate-limit, CORS, helmet.

Perf: índices Mongo, projeções lean, paginação, TTL para logs/entregas antigas.

Logs/trace: Nest logger, request-id, correlação, métricas (Prometheus), health/readiness.

Corrija imediatamente problemas encontrados e registre changelog com commits convencionais.

Atualize Swagger (/v1/docs) — descrições em inglês + @ApiBody com exemplos; assegure consistência.

Sempre que entregar algo, atualize a documentação e forneça passos de teste reproduzíveis (curl/Swagger/WS + consultas Mongo).

2) Roadmap imediato (prioridades)

Dashboard base (Commit 10)

Admin Dashboard API (/v1/admin/*):

Tenants/Plans/Quotas (Free/Indie/Studio/Enterprise) — CRUD completo.

Métricas globais: projetos, jogadores, eventos/mês, entregas ok/falhas, consumo de quotas.

Billing hooks (placeholder para Stripe/Paddle) + usage counters.

Client Dashboard API (/v1/client/*):

Projetos do cliente (CRUD), API Keys (emitir, listar, revogar, roles), Webhooks (CRUD), Realtime destinations.

Relatórios: eventos por dia, jogadores ativos, compras, moedas gastas/ganhas.

API Keys Service:

Geração segura (prefixo + hash no DB), perms/escopos por project/tenant, expiração opcional, rotacionamento e revogação.

Rate limit por key (global + por endpoint crítico).

Autenticação Painéis:

Admin: e-mail+senha (ou OIDC), 2FA opcional, RBAC (roles: superadmin, admin, support).

Client: e-mail+senha/OIDC, RBAC (owner, developer, analyst), escopos por projeto.

Contractos de consumo (Jogadores & Clientes)

Endpoints públicos (consumo por jogo/app, com API Key do projeto):

Players: get profile, XP, level, moedas, inventário, conquistas, quests ativas/completas.

Progression: award XP (idempotente), calcular próximo nível/threshold.

Wallet: saldo/histórico (paginado), crédito/débito idempotente.

Items: grant/consume, inventário por player, stack limits.

Quests: listar ativas/estado do player, marcar progresso.

Counters: increment/reset com unlocks; leitura atual.

Store: catálogo/sku detail, purchase idempotente, recibo e efeitos (XP/itens/moedas).

Endpoints de Client/Admin (backoffice):

CRUD completo de projetos, chaves, webhooks, planos/quotas, SKUs, itens, achievements, curvas de XP/níveis, destinos realtime, etc.

Paginação, filtros, ordenação e busca em todos os GETs listáveis (cursor/offset).

Qualidade & Escala

Testes: unit (services), integration (controllers + Mongo in-memory), e2e (supertest), contratos (OpenAPI snapshot), carga (k6/artillery) — roteiros no docs/TESTS.md.

Observabilidade: /metrics (Prometheus), logs estruturados (JSON) com tenantId/projectId/event.id, tracing opcional (OTel).

Cache: Redis para listas quentes (catálogo, definições de itens/achievements), com invalidação por evento.

Rate limiting e cotas por plano (requests/mês, eventos/mês, jogadores, projetos).

Segurança: Helmet, CSP (se expor painéis), CORS estrito, secrets via env/secret manager, validação rigorosa de entrada (class-validator), escaping seguro.

Migrações (mongosh scripts ou migrate tool) e backups (TTL/retention + indicadores).

Feature Flags (configuráveis por tenant/projeto).

Kubernetes & CI/CD

Dockerfile multi-stage (build, runtime distroless).

Helm Chart com:

Deployments (API, cron worker — pode ser o mesmo pod com flags ou job separado), HPA, liveness/readiness probes.

ConfigMaps/Secrets para envs, Ingress (TLS), ServiceAccount/RBAC mínimos.

Requests/limits, node affinity, PodSecurity Standards.

CI/CD (GitHub Actions):

Lint+Tests, Build Image, SCA (Dependabot), Trivy/Grype scan, push ECR/GCR, deploy Helm (staging/prod).

SLOs (p.ex., p95 latency por endpoint, taxa de erro <0.5%).

3) Requisitos Funcionais (detalhados)

Multi-tenant & Multi-project

Header obrigatório x-tenant-id em todas as rotas (exceto health/docs).

projectId validado e associado ao tenant (guard/middleware).

RBAC: admin global x client project-scoped.

Players

Criar/atualizar, soft delete, buscar por username/ID.

Perfil público: username, level, XP, moedas, inventário, conquistas, quests.

Eventos: player.created, player.xp.added, player.level.updated, player.levelup.

Progression

Award XP idempotente (com idempotencyKey), curvas de XP configuráveis por projeto (tabela ou fórmula).

Cálculo de level + disparo de eventos (WS + webhooks).

Wallet & Inventory

Soft/hard currencies; crédito/débito idempotentes; histórico com metadados.

Items: definições (stackLimit, efeitos), grant/consume, inventário por player.

Eventos: wallet.credited/debited, item.granted/consumed.

Achievements & Quests & Counters

Achievements por thresholds e condições; unlock event.

Quests ativas/completas, objetivos, rewards (XP/itens).

Counters com incrementos e triggers de unlock.

Store

Catálogo/SKUs, bundles, precificação soft/hard, purchase idempotente com efeitos aplicados.

Eventos: store.purchase.succeeded.

Events (core)

Persistência em events, broadcast no WS do projeto, enfileiramento de webhooks.

Consulta/admin: filtros por type, player, período; export (NDJSON/CSV).

Webhooks

Subscriptions (CRUD), HMAC (documentado), deliveries com retries/backoff, DLQ opcional.

Reentrega (redrive) manual, visualização de falhas.

Realtime (WS)

Handshake por query (x-api-key, x-tenant-id, x-project-id) → { type: "hello", ... }

Subscribe obrigatório: { action: "subscribe", eventTypes: ["*"] } → { type: "subscribed" }

Filtro por projeto/tenant; suporte a lista de eventTypes; limite REALTIME_MAX_EVENTTYPES.

Mensagens: eventos do domínio e erros (unknown_action, missing_headers).

API Keys

CRUD: gerar (salvar hash), listar, rotacionar, revogar, definir escopos/roles/expiração.

Uso: cabeçalho (x-api-key), com quotas por plano e rate limit.

Dashboards

Admin: tenants, planos/quotas, métricas globais, billing usage.

Client: projetos, chaves, webhooks, realtime, métricas do projeto.

SDKs

Node: wrapper REST + WS + assinatura HMAC helper.

Unity/Unreal (interface e exemplo mínimo).

4) Requisitos Não-Funcionais

Segurança: OWASP, secrets via env/secret manager, criptografias para dados sensíveis (quando aplicável), audits.

Observabilidade: logs estruturados, tracing (OTel opcional), /metrics.

Performance: índices, projeções lean, cache, HPA, N+1 evitado, batch ops.

Qualidade: 90%+ cobertura em módulos críticos; lint/format; PR checklist.

Compatibilidade: Node 18+, Mongo 6+, APIs documentadas e estáveis (sem quebrar contratos sem versionamento).

5) Entregáveis por Iteração

Para cada feature/ajuste, entregue:

Código + testes (unit/integration/e2e mínimos).

Docs atualizadas (README.md + docs/*.md), com como testar (curl/Swagger/WS) e critério de aceite.

Migrações/scripts se necessário.

Métricas/alertas se for endpoint crítico.

Mensagem de commit Conventional Commits.

6) Estrutura Esperada (exemplo)
/src
  /modules
    /admin (dash APIs)
    /client (dash APIs)
    /apikeys
    /projects
    /players
    /progression
    /wallet (inventory)
    /items
    /store
    /quests
    /counters
    /achievements
    /events
    /webhooks
    /realtime
    /common (guards, validators, filters rfc7807, interceptors, pipes)
/docs
  README.md (links bonitos)
  ENV.md, SETUP.md, REST.md, WS.md, WEBHOOKS.md, TROUBLESHOOTING.md, CONTRIBUTING.md, TESTS.md, K8S.md
helm/ (chart)
/.github/workflows (ci.yaml)
Dockerfile

7) Passos Concretos (execute agora)

Subir projeto e validar saúde (/v1/health, /v1/docs); ajusta swagger (inglês+exemplos) onde faltar.

Implementar Commit 10 (Dashboard base):

Criar módulos admin e client + apikeys, rotas, DTOs, RBAC.

CRUD Plans/Quotas, Projects, API Keys, Webhooks; métricas/aggregations por dia/mês.

Endpoints de leitura para clients & jogos (perfil player, xp/level, quests, moedas, inventário, conquistas, store catalog).

Documentar e adicionar exemplos.

API Keys (hash, escopos, rate limit, quotas por plano) + guards.

Observabilidade: /metrics, logs JSON, correlation-id, sampling de trace.

Caching (Redis) de catálogos/definições; invalidar por evento.

CI/CD: GitHub Actions (lint/test/build/publish), Dockerfile, Helm Chart inicial (docs/K8S.md).

Testes: roteiros e2e (supertest) que cobrem fluxo de compra idempotente, XP/level, webhooks e realtime.

Doc viva: atualizar README.md (links bonitos), docs/*.md, e mostrar como testar cada entrega (curl/Swagger/WS, scripts k6).

8) Critérios de Aceite (exemplos)

API Keys: criar/listar/revogar/rotacionar; uso bloqueado após revogação; rate limit por key configurável.

Realtime: ao conectar + { action:"subscribe", eventTypes:["*"] }, publicar player.xp.added em XP award e receber no WS (com teste e2e).

Webhooks: subscription, delivery com HMAC, retry/backoff; inspeção de falhas; redrive manual.

Store: purchase com idempotencyKey aceita 1x; múltiplas tentativas ⇒ mesma resposta.

Quotas: plano Free bloqueia ao exceder eventos/mês; logs e Problem JSON coerentes.

9) Estilo de Código & Commits

Conventional Commits (feat:, fix:, docs:, refactor:, chore:).

DTOs com class-validator (mensagens claras) e Swagger @ApiProperty/@ApiBody (inglês).

Problem JSON (RFC7807) para erros.

Sempre emitir eventos via EventsService.log(...) em cada mudança de estado.

10) Mostre Como Testar (sempre)

Inclua curl scripts e exemplos no Swagger.

Para WS: comando wscat + payload subscribe + operação que dispara evento.

Para webhooks: receiver.js local + assinatura + operação geradora.

Para K8s: helm install/upgrade com valores de exemplo e readiness/liveness.

Agora execute: faça a leitura, reporte problemas e proponha o plano de execução; em seguida implemente Commit 10 (Dashboard base + API Keys + RBAC + métricas) com testes e docs.

Verifique erros e os corrija antes de tudo;
Sempre verifique se os pacotes que voce vai usar estao instalados e se nao estiverem, instale-os.