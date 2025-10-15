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
