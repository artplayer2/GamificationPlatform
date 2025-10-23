# Troubleshooting

## WebSocket connected but no messages
- Send subscribe: `{ "action":"subscribe", "eventTypes":["*"] }`.
- The socket filters by **tenant + project**. Use the same IDs as your REST calls.
- Trigger a new event **after** subscribing; no replay.
- Confirm in DB:
  ```js
  use gamification
  db.events.find({ projectId:"<PROJECT_ID>" }).sort({createdAt:-1}).limit(5)
  ```

## Webhook not delivered
- Ensure receiver returns 200 OK.
- Validate HMAC secret.
- Inspect `webhook_deliveries` for status/response.

## Rate Limit & Redis issues
- `ECONNREFUSED` connecting to Redis:
  - Check host/port/firewall and whether Redis is running.
  - Verify `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`.
- `WRONGPASS` or auth errors:
  - If using `REDIS_URL`, encode `@` in password as `%40`.
  - Example: `redis://:Luminalab%402025@host:6379/0`.
- Requests not hitting 429:
  - Ensure `TENANT_RPS_DEFAULT` or `PLAYER_RPS_DEFAULT` are low for testing (e.g., `1`).
  - Call same endpoint twice with same headers to force bucket increment.
- Fallback behavior:
  - If Redis is down, rate limit fails open (allows requests) and logs a warning.

## Port 3000 occupied (EADDRINUSE)
- Feche o terminal onde o servidor foi iniciado (`npm run start`/`start:dev`).
- Verifique qual processo está ouvindo a porta 3000 (Windows):
  - `netstat -ano | findstr LISTENING | findstr :3000`
- Mate o processo: `taskkill /PID <PID> /F`
- Reinicie o servidor e valide: `http://localhost:3000/v1/health` e `http://localhost:3000/v1/docs`
