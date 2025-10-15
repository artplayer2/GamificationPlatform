# API Headers

This project uses standard headers to provide tenant/project context and optional API key authentication.

## Required Headers

- `x-tenant-id`: Tenant ID (e.g. demo). Required for most endpoints.
  - Example: `-H "x-tenant-id: demo"`

## Optional / Context Headers

- `x-api-key`: Project API Key. Required for certain Client endpoints and WebSocket access.
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

> Tip: The global REST prefix is `v1`. Controllers use paths without `v1` (e.g., `@Controller('projects')`) to avoid double prefixes.