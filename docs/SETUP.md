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
    - `PLAYER_RPS_DEFAULT` (e.g., `300` per minute)

- Run in development:
  - `npm run start:dev`
  - Swagger UI: `http://localhost:3000/v1/docs`

- Common issues:
  - If Swagger shows connection refused, ensure MongoDB is running and `MONGO_URI` is reachable.
  - If JWT expires parsing fails, use numeric seconds (e.g., `3600`).
