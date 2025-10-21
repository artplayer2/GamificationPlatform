# API Headers

This project uses standard headers to provide tenant/project context and API key authentication.

## Required Headers

- `x-tenant-id`: Tenant ID (e.g. demo). Required for admin/client endpoints.
  - Example: `-H "x-tenant-id: demo"`

- `Authorization: Bearer <JWT>`: Player token for `/v1/player/*` endpoints and store purchase.
  - When Bearer is present, `x-tenant-id` is not required for player routes (tenant/project are derived from the token).

## Optional / Context Headers

- `x-api-key`: API Key.
  - Required for Admin routes (tenant-level key; no `projectId`) and Webhooks management.
  - Required for Client routes that read project data (project-level key) and for WebSocket access.
  - Required for Items, Achievements, Inventory, Quests, Players, and Progression REST endpoints.
  - Example: `-H "x-api-key: gmk_..."`
- `x-project-id`: Project ID used by the WebSocket gateway to route messages.
  - Example (query string): `ws://localhost:3000/realtime?x-project-id=<PROJECT_ID>&x-tenant-id=demo&x-api-key=gmk_...`

## Examples

Create a Project (REST):
```bash
curl -s -X POST http://localhost:3000/v1/projects \
  -H "x-tenant-id: demo" \
  -H "Content-Type: application/json" \
  -d '{ "name": "demo", "plan": "free" }'
```

Create Webhook Subscription (REST):
```bash
curl -s -X POST http://localhost:3000/v1/webhooks/subscriptions \
  -H "x-tenant-id: demo" \
  -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<PROJECT_ID>",
    "url": "https://example.tld/webhooks/ingest",
    "secret": "whsec_9a87c1...",
    "eventTypes": ["player.created","*"]
  }'
```

Realtime (WebSocket):
```bash
npx wscat -c "ws://localhost:3000/realtime?x-api-key=<PLAINTEXT_API_KEY>&x-project-id=<PROJECT_ID>&x-tenant-id=demo"
```

Store purchase (REST) with Bearer:
```bash
curl -s -X POST http://localhost:3000/v1/store/purchase \
  -H "Authorization: Bearer <PLAYER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "<PROJECT_ID>",
    "skuCode": "bundle_potions_small",
    "playerId": "<PLAYER_ID>",
    "qty": 1,
    "idempotencyKey": "order-0001-a"
  }'
```

> Tip: The global REST prefix is `v1`. Controllers use paths without `v1` (e.g., `@Controller('projects')`) to avoid double prefixes.