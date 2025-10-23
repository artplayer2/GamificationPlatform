# Development Setup

- Prerequisites:
  - Node.js 18+
  - MongoDB running locally or a connection string in `MONGO_URI`

- Install dependencies:
  - `npm install`

- Environment variables:
  - See `docs/ENV.md`. Minimum:
    - `MONGO_URI` (e.g., `mongodb://localhost:27017/gamification`)
    - `PLAYER_JWT_SECRET` (e.g., `dev-player-secret`)
    - `PLAYER_JWT_EXPIRES` (e.g., `1h` or `3600` seconds)
    - `TENANT_RPS_DEFAULT` (e.g., `300` per minute)
    - `PLAYER_RPS_DEFAULT` (e.g., `300` per minute)

- Rate Limit & Redis (recommended):
  - Production: configure Redis to enable strict per-tenant/player limits.
  - Prefer `REDIS_URL` (e.g., `redis://:password@host:6379/0`). If password has `@`, use `%40`.
  - Alternative: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
  - Quick test: set `TENANT_RPS_DEFAULT=1`, call twice the same route; second returns `429`.
  - See `docs/ENV.md` for full Redis notes and examples.

- Run in development:
  - `npm run start:dev`
  - Swagger UI: `http://localhost:3000/v1/docs`

- Common issues:
  - If Swagger shows connection refused, ensure MongoDB is running and `MONGO_URI` is reachable.
  - If JWT expires parsing fails, use numeric seconds (e.g., `3600`).
