# API Headers

Headers control authentication, tenant context, and rate limiting across the API.

## Required Headers

- `x-tenant-id`: Tenant identifier. Required for admin/client endpoints. Not required for `/v1/player/*` routes when using Bearer.
- `Authorization: Bearer <JWT>`: Player auth for `/v1/player/*` routes.
- `x-api-key`: API key for client/admin endpoints.

## Optional Headers

- `x-project-id`: Project identifier for client endpoints where project context is needed.

## Examples

- Admin metrics
```bash
curl -s http://localhost:3000/v1/admin/metrics \
  -H "x-tenant-id: demo" \
  -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>"
```

- Player profile
```bash
curl -s http://localhost:3000/v1/player/me/profile \
  -H "Authorization: Bearer <JWT>"
```

## Project Secrets

Project keys are managed via admin endpoints.
- Create project: `POST /v1/projects` (Headers: `x-tenant-id`, `x-api-key`)
  - Response returns `publicKey` and `plaintextSecret` once. The secret hash is stored server-side.
- Rotate secret: `POST /v1/projects/:id/rotate-secret` (Headers: `x-tenant-id`, `x-api-key`)
  - Response returns the new `plaintextSecret` once.

Example (rotate secret):
```bash
curl -s -X POST http://localhost:3000/v1/projects/<PROJECT_ID>/rotate-secret \
  -H "x-tenant-id: demo" \
  -H "x-api-key: <PLAINTEXT_ADMIN_API_KEY>"
```