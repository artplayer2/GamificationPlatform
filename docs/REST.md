# REST API (Quick Examples)

All requests (except health/docs) must include the tenant header:
```
x-tenant-id: demo
```

## Create Project
`POST /v1/projects`
```json
{ "name": "demo", "plan": "free" }
```

## Create Player
`POST /v1/players`
```json
{ "projectId": "<PROJECT_ID>", "username": "the_wizard_77" }
```

## Award XP
`POST /v1/progression/xp`
```json
{ "playerId": "<PLAYER_ID>", "amount": 250, "reason": "quest:starter", "idempotencyKey": "xp-00001-abc" }
```

## Wallet Credit/Debit
`POST /v1/inventory/wallet/credit`
```json
{ "playerId": "<PLAYER_ID>", "currency": "soft", "amount": 100, "idempotencyKey": "op-123456", "reason": "purchase:small_pack" }
```
`POST /v1/inventory/wallet/debit`
```json
{ "playerId": "<PLAYER_ID>", "currency": "hard", "amount": 10, "idempotencyKey": "op-123457", "reason": "store:buy_item" }
```

## Items Consume
`POST /v1/items/consume`
```json
{ "projectId":"<PROJECT_ID>", "code":"potion_small", "playerId":"<PLAYER_ID>", "qty":1, "idempotencyKey":"item-consume-001", "reason":"use_in_battle" }
```

## Store Purchase
`POST /v1/store/purchase`
```json
{ "projectId":"<PROJECT_ID>", "skuCode":"bundle_potions_small", "playerId":"<PLAYER_ID>", "qty":1, "idempotencyKey":"order-0001-a", "reason":"promo:launch" }
```

## API Keys (Client Dashboard)

All endpoints require `x-tenant-id`. Some reads require `x-api-key`.

`POST /v1/client/apikeys`
```bash
curl -X POST http://localhost:3000/v1/client/apikeys \
  -H "x-tenant-id: demo" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Unity client key",
    "projectId":"<PROJECT_ID>",
    "roles":["owner"],
    "scopes":["read:*","write:events"],
    "rateLimitPerMin":600
  }'
```
Response (plaintext key returned once):
```json
{ "id":"<ID>", "prefix":"gmk_abc123...", "plaintextKey":"gmk_...", "roles":["owner"], "scopes":["read:*","write:events"] }
```

`GET /v1/client/apikeys`
```bash
curl -s http://localhost:3000/v1/client/apikeys -H "x-tenant-id: demo"
```

`POST /v1/client/apikeys/:id/revoke`
```bash
curl -X POST http://localhost:3000/v1/client/apikeys/<ID>/revoke -H "x-tenant-id: demo"
```

`POST /v1/client/apikeys/:id/rotate`
```bash
curl -X POST http://localhost:3000/v1/client/apikeys/<ID>/rotate -H "x-tenant-id: demo"
```

## Client Metrics

`GET /v1/client/metrics/project/:projectId`
Requires `x-api-key` and `x-tenant-id` (and must belong to the project).
```bash
curl -s http://localhost:3000/v1/client/metrics/project/<PROJECT_ID> \
  -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_API_KEY>"
```

## Admin Metrics

`GET /v1/admin/metrics`
```bash
curl -s http://localhost:3000/v1/admin/metrics -H "x-tenant-id: demo"
```
