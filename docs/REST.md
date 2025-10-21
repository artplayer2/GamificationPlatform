# REST API (Quick Examples)

Most requests require the tenant header. Admin/Client endpoints also require `x-api-key`. Player routes use `Authorization: Bearer <JWT>`.
```
x-tenant-id: demo
```

## Rate Limits

Requests authenticated with `x-api-key` or `Authorization: Bearer <JWT>` are subject to rate limits:
- API keys: global per-key limit (default `600` requests/minute).
- Player tokens: per-player limit (configurable via `PLAYER_RPS_DEFAULT`, default `300` requests/minute).

Exceeding limits returns `429 Too Many Requests`.

## Authorization in Swagger
- Open Swagger: `http://localhost:3000/v1/docs`.
- Click "Authorize" and provide:
  - `Tenant`: `x-tenant-id` (e.g., `demo`) for admin/client endpoints.
  - `ApiKey`: `x-api-key` for client endpoints that require it.
  - `Bearer`: Player token for `/v1/player/*` endpoints.
- Note: When Bearer is present, you do not need `x-tenant-id` on `/v1/player/*` requests.
- Endpoints requiring `x-api-key`: Items, Achievements, Inventory, Quests, Players, Progression, Client dashboards.
- Store purchase requires `Authorization: Bearer <JWT>`.

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
Headers: `x-tenant-id`, `x-api-key`

## Award XP
`POST /v1/progression/xp`
```json
{ "playerId": "<PLAYER_ID>", "amount": 250, "reason": "quest:starter", "idempotencyKey": "xp-00001-abc" }
```
Headers: `x-tenant-id`, `x-api-key`

## Wallet Credit/Debit
`POST /v1/inventory/wallet/credit`
```json
{ "playerId": "<PLAYER_ID>", "currency": "soft", "amount": 100, "idempotencyKey": "op-123456", "reason": "purchase:small_pack" }
```
Headers: `x-tenant-id`, `x-api-key`
`POST /v1/inventory/wallet/debit`
```json
{ "playerId": "<PLAYER_ID>", "currency": "hard", "amount": 10, "idempotencyKey": "op-123457", "reason": "store:buy_item" }
```
Headers: `x-tenant-id`, `x-api-key`

## Items Consume
`POST /v1/items/consume`
```json
{ "projectId":"<PROJECT_ID>", "code":"potion_small", "playerId":"<PLAYER_ID>", "qty":1, "idempotencyKey":"item-consume-001", "reason":"use_in_battle" }
```
Headers: `x-tenant-id`, `x-api-key`

## Store Purchase
`POST /v1/store/purchase`
```json
{ "projectId":"<PROJECT_ID>", "skuCode":"bundle_potions_small", "playerId":"<PLAYER_ID>", "qty":1, "idempotencyKey":"order-0001-a", "reason":"promo:launch" }
```
Headers: `Authorization: Bearer <JWT>`

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

## Client - Players

All endpoints require `x-tenant-id` and `x-api-key` and must target the correct `projectId`.

`GET /v1/client/players/project/:projectId`
List players (id, username, xp, level, wallet)
```bash
curl -s http://localhost:3000/v1/client/players/project/<PROJECT_ID> \
  -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_API_KEY>"
```

`GET /v1/client/players/project/:projectId/username/:username`
Get player by username
```bash
curl -s http://localhost:3000/v1/client/players/project/<PROJECT_ID>/username/the_wizard_77 \
  -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_API_KEY>"
```

`GET /v1/client/players/project/:projectId/:playerId`
Get player details
```bash
curl -s http://localhost:3000/v1/client/players/project/<PROJECT_ID>/<PLAYER_ID> \
  -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_API_KEY>"
```

`GET /v1/client/players/project/:projectId/:playerId/achievements`
List player achievements (with metadata)
```bash
curl -s http://localhost:3000/v1/client/players/project/<PROJECT_ID>/<PLAYER_ID>/achievements \
  -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_API_KEY>"
```

## Client - Leaderboards

`GET /v1/client/leaderboards/project/:projectId/top/xp`
Requires `x-api-key` and `x-tenant-id`. Returns top players by XP (all-time).
```bash
curl -s http://localhost:3000/v1/client/leaderboards/project/<PROJECT_ID>/top/xp \
  -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_API_KEY>" \
  -G --data-urlencode "limit=20"
```
Response:
```json
{ "projectId":"<PROJECT_ID>", "leaderboard":"xp_alltime", "items":[ {"rank":1,"id":"...","username":"...","xp":1234,"level":10} ] }
```

`GET /v1/client/leaderboards/project/:projectId/player/:playerId/xp/rank`
Requires `x-api-key` and `x-tenant-id`. Returns the player's XP rank.
```bash
curl -s http://localhost:3000/v1/client/leaderboards/project/<PROJECT_ID>/player/<PLAYER_ID>/xp/rank \
  -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_API_KEY>"
```
Response:
```json
{ "projectId":"<PROJECT_ID>", "leaderboard":"xp_alltime", "rank":42, "player": {"id":"...","username":"...","xp":1234,"level":10}, "totalPlayers": 500 }
```

## Player Auth (Password)

`POST /v1/player/auth/register`
Registers a player with `projectId` and `username` or `email` + `password`.
```bash
curl -s -X POST http://localhost:3000/v1/player/auth/register \
  -H "x-tenant-id: demo" -H "Content-Type: application/json" \
  -d '{
    "projectId":"<PROJECT_ID>",
    "username":"the_wizard_77",
    "email":"wizard@example.com",
    "password":"Str0ngPass!",
    "profile": { "displayName": "The Wizard", "country": "BR" }
  }'
```
Response:
```json
{ "player": { "id": "...", "username": "the_wizard_77", "email": "wizard@example.com" }, "projectId": "<PROJECT_ID>" }
```

`POST /v1/player/auth/login/password`
Logs in using `username` or `email` + `password`.
```bash
curl -s -X POST http://localhost:3000/v1/player/auth/login/password \
  -H "x-tenant-id: demo" -H "Content-Type: application/json" \
  -d '{ "projectId":"<PROJECT_ID>", "username":"the_wizard_77", "password":"Str0ngPass!" }'
```
Response:
```json
{ "tokenType":"Bearer", "accessToken":"<JWT>", "expiresIn":"1h", "player": { "id":"...", "username":"the_wizard_77" }, "projectId":"<PROJECT_ID>" }
```

## Player Auth (DEV)

`POST /v1/player/auth/login`
Issue a player Bearer token using `username` + `projectId` (requires `x-tenant-id`).
```bash
curl -s -X POST http://localhost:3000/v1/player/auth/login \
  -H "x-tenant-id: demo" -H "Content-Type: application/json" \
  -d '{"projectId":"<PROJECT_ID>","username":"the_wizard_77"}'
```
Response:
```json
{ "tokenType":"Bearer", "accessToken":"<JWT>", "player": {"id":"...","username":"the_wizard_77"}, "projectId":"<PROJECT_ID>", "expiresIn":"1h" }
```

## Player - Me

Use `Authorization: Bearer <JWT>` from the login step.

`GET /v1/player/me`
```bash
curl -s http://localhost:3000/v1/player/me \
  -H "Authorization: Bearer <JWT>"
```

`GET /v1/player/me/achievements`
```bash
curl -s http://localhost:3000/v1/player/me/achievements \
  -H "Authorization: Bearer <JWT>"
```

## Player - Profile

`GET /v1/player/me/profile`
```bash
curl -s http://localhost:3000/v1/player/me/profile \
  -H "Authorization: Bearer <JWT>"
```
Response:
```json
{ "id":"...", "username":"the_wizard_77", "email":"wizard@example.com", "profile": { "displayName":"The Wizard","country":"BR" } }
```

`PUT /v1/player/me/profile`
```bash
curl -s -X PUT http://localhost:3000/v1/player/me/profile \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{ "profile": { "displayName":"Archmage", "country":"BR" } }'
```
Response:
```json
{ "updated": true }
```

`PUT /v1/player/me/password`
```bash
curl -s -X PUT http://localhost:3000/v1/player/me/password \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{ "oldPassword": "Str0ngPass!", "newPassword": "EvenStr0nger!" }'
```
Response:
```json
{ "changed": true }
```

## Player - Leaderboards

Player endpoints use `Authorization: Bearer <JWT>` from Player Auth. When a valid Bearer token is present, the `x-tenant-id` header is not required for `/v1/player/...` routes (tenant/project are derived from the token).

`GET /v1/player/leaderboards/top/xp`
Top players by XP (all-time). Optional `limit` query param (default 20, max 100).
```bash
curl -s http://localhost:3000/v1/player/leaderboards/top/xp \
  -H "Authorization: Bearer <JWT>" \
  -G --data-urlencode "limit=20"
```
Response:
```json
{ "projectId":"<PROJECT_ID>", "leaderboard":"xp_alltime", "items": [ { "rank": 1, "id": "...", "username": "...", "xp": 1234, "level": 10 } ] }
```

`GET /v1/player/leaderboards/me/xp/rank`
Returns your XP rank within the project.
```bash
curl -s http://localhost:3000/v1/player/leaderboards/me/xp/rank \
  -H "Authorization: Bearer <JWT>"
```
Response:
```json
{ "projectId":"<PROJECT_ID>", "leaderboard":"xp_alltime", "rank": 42, "player": { "id":"...","username":"...","xp":1234,"level":10 }, "totalPlayers": 500 }
```

## Admin Metrics

`GET /v1/admin/metrics`
```bash
curl -s http://localhost:3000/v1/admin/metrics -H "x-tenant-id: demo" -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>"
```
