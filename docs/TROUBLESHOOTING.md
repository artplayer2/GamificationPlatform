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

## Port 3000 occupied (EADDRINUSE)
- Feche o terminal onde o servidor foi iniciado (`npm run start`/`start:dev`).
- Verifique qual processo está ouvindo a porta 3000 (Windows):
  - `netstat -ano | findstr LISTENING | findstr :3000`
- Mate o processo: `taskkill /PID <PID> /F`
- Reinicie o servidor e valide: `http://localhost:3000/v1/health` e `http://localhost:3000/v1/docs`
