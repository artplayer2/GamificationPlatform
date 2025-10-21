# Limites e Quotas

Este documento descreve como a plataforma aplica limites de tráfego e como os limites por plano serão integrados.

## Rate Limit por Tenant (REST)
Middleware global: `TenantRateLimitMiddleware`
- Janela: 1 minuto
- Limite base: `TENANT_RPS_DEFAULT` (padrão `300`) requisições/min por tenant (via cabeçalho `x-tenant-id`)
- Ignora: `/v1/health`, `/v1/docs`, `/v1/docs-json`
- Configuração do tenant header por env: `TENANT_HEADER` (padrão `x-tenant-id`)

Chave de rate-limit:
- Se `x-tenant-id` presente, o valor é usado.
- Caso contrário (rotas públicas), usa IP como fallback.

## Rate Limit por API Key (Client Guard)
Guard: `ApiKeyAuthGuard`
- Exige `x-tenant-id`, `x-api-key`, `x-project-id`.
- Valida chave ativa e não expirada; aceita chaves do projeto ou globais.
- Janela: 1 minuto; limite por chave: `rateLimitPerMin` (default 600).
- Em excesso, responde `429 Too Many Requests`.

Anexo de contexto:
- `req.apiKey = { id, tenantId, projectId, roles, scopes, prefix }`

## Limites por Plano (Design)
Campos definidos em `Plan.limits`:
- `restMaxReqPerMin`
- `wsMaxClients`
- `wsMaxEventTypes`
- `webhookTimeoutMs`
- `webhooksMaxPerMin`
- `storageMaxEvents`
- `storageMaxPlayers`

Integração prevista:
- Middleware de limites por plano (`PlanLimitsMiddleware`) ajustando:
  - Rate-limit REST por tenant segundo `restMaxReqPerMin`.
  - Gate Realtime segundo `wsMaxClients` e `wsMaxEventTypes`.
  - Enfileiramento de webhooks segundo `webhooksMaxPerMin` e `webhookTimeoutMs`.
  - Restrições de persistência/logs por `storageMax*` com métricas/alertas.

## Realtime Gateway
- Variáveis de ambiente:
  - `REALTIME_MAX_CLIENTS` (padrão 1000)
  - `REALTIME_MAX_EVENTTYPES` (padrão 50)
  - `REALTIME_DEV_API_KEY` (opcional, só DEV)
- Exige `x-api-key`, `x-project-id`, `x-tenant-id` (headers ou query string).
- Fecha conexões com códigos específicos (`missing_headers`, `invalid_api_key`, `invalid_project_id`, `too_many_connections`).

## Webhooks
- `webhookTimeoutMs` controla tempo de espera por entrega.
- `webhooksMaxPerMin` fornece base para rate-limit de entregas.
- Entregas são enfileiradas e processadas em lote pelo **Cron Worker** (vide `docs/WEBHOOKS.md`).

## Boas Práticas
- Ajuste `rateLimitPerMin` nas API Keys de acordo com consumo previsto.
- Use planos para segmentar clientes por necessidade; documente expectativas comerciais e técnicas.
- Monitore métricas (Admin Metrics) para calibrar limites e antecipar upgrades de plano.