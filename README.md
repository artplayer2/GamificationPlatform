# Gamification Platform API

Multi-tenant, modular **gamification backend** built with **Node.js + NestJS + MongoDB**.  
Provides **REST APIs**, **WebSockets** (realtime), and **Webhooks** (with retries & HMAC) for games/apps (Unity, Unreal, Mobile, SaaS).

---

## 🔗 Quick Links
- 📘 **Swagger (OpenAPI)**: [http://localhost:3000/v1/docs](http://localhost:3000/v1/docs)
- 🩺 **Health**: [http://localhost:3000/v1/health](http://localhost:3000/v1/health)
- ⚡ **WebSocket Gateway**: `ws://localhost:3000/realtime`
- 🧰 **Docs (folder)**: [`/docs`](./docs)
  - 🚀 [Setup](./docs/SETUP.md)
  - ⚙️ [Environment](./docs/ENV.md)
  - 🔌 [REST Examples](./docs/REST.md)
  - 🛰️ [WebSocket Realtime](./docs/WS.md)
  - 📬 [Webhooks](./docs/WEBHOOKS.md)
  - 🆘 [Troubleshooting](./docs/TROUBLESHOOTING.md)
  - 🤝 [Contributing & Commits](./docs/CONTRIBUTING.md)

---

## ✨ Highlights
- **Multi-tenant** (logical isolation by `x-tenant-id` and `projectId`)
- **Players, Progression (XP/Levels), Achievements, Items, Inventory, Wallet, Store, Quests, Counters**
- **Events** persisted (Mongo), broadcast via **WebSocket**, and delivered via **Webhooks**
- **Idempotency** by `idempotencyKey` or unique constraints
- **Problem+JSON (RFC7807)** style errors
- **Swagger** docs at `/v1/docs`
- **Cron Worker** for webhook deliveries (automatic retries/backoff)
- **Plugin-based** architecture and **SDK-ready**

---

## 🧪 Quick Start
1. **Environment**
   ```bash
   cp .env.example .env
   # Minimum:
   # PORT=3000
   # NODE_ENV=development
   # MONGO_URI=mongodb://localhost:27017/gamification
   # TENANT_HEADER=x-tenant-id
   # API_KEY=dev-api-key
   # REALTIME_DEV_API_KEY=dev-api-key
   # REALTIME_MAX_EVENTTYPES=50
   # REALTIME_MAX_CLIENTS=1000
   # WEBHOOK_TIMEOUT_MS=5000
   ```

2. **Install & Run**
   ```bash
   npm install
   npm run start:dev
   # API: http://localhost:3000/v1
   # Docs: http://localhost:3000/v1/docs
   ```

3. **Create a Project**
   - Header: `x-tenant-id: demo`
   - `POST /v1/projects`
   ```json
   { "name": "demo", "plan": "free" }
   ```

4. **Create a Player**
   - Header: `x-tenant-id: demo`
   - `POST /v1/players`
   ```json
   { "projectId": "<PROJECT_ID>", "username": "the_wizard_77" }
   ```

5. **Award XP**
   - Header: `x-tenant-id: demo`
   - `POST /v1/progression/xp`
   ```json
   { "playerId": "<PLAYER_ID>", "amount": 250, "reason": "quest:starter", "idempotencyKey": "xp-00001-abc" }
   ```

6. **Realtime (WebSocket)**
   - Connect:
     ```bash
     npx wscat -c "ws://localhost:3000/realtime?x-api-key=dev-api-key&x-project-id=<PROJECT_ID>&x-tenant-id=demo"
     ```
     Response:
     ```json
     { "type":"hello", "ok":true, "projectId":"<PROJECT_ID>" }
     ```
   - **Subscribe (required):**
     ```
     { "action":"subscribe", "eventTypes":["*"] }
     ```
     Ack:
     ```
     { "type":"subscribed", "eventTypes":["*"] }
     ```
   - Trigger an event (e.g., award XP) and you’ll see it in the socket.

7. **Webhooks**
   - Start a receiver (example): see **[docs/WEBHOOKS.md](./docs/WEBHOOKS.md)**
   - `POST /v1/webhooks/subscriptions` with your endpoint URL & secret
   - Events are enqueued and delivered by the **Cron Worker** every 5s

---

## 🧩 Modules (Overview)
- `projects` – tenant/project base, validation
- `players` – lifecycle, username, wallet link
- `progression` – XP & level (curves configurable)
- `achievements` – thresholds & unlocks
- `items` – definitions, grant/consume
- `inventory` – wallet (soft/hard), balance, txs
- `store` – skus/catalog, idempotent purchases
- `quests` – goals & rewards (XP/items)
- `counters` – increments & unlock events
- `events` – persist + WS broadcast + webhook enqueue
- `webhooks` – subscriptions, deliveries, retries, HMAC
- `realtime` – WS gateway (hello/subscribed + streaming)

---

## 🧾 Events (canonical types)
- `player.created`, `player.xp.added`, `player.level.updated`, **`player.levelup`**
- `wallet.credited`, `wallet.debited`
- `item.granted`, `item.consumed`
- `quest.completed`, `achievement.unlocked`
- `store.purchase.succeeded`, `counter.incremented`

> All events go to **Mongo** (`events`), **WS** (project channel), and **Webhooks** (if subscribed).

---

## 📚 Developer Docs
- 🚀 [Setup](./docs/SETUP.md)
- ⚙️ [Environment](./docs/ENV.md)
- 🔌 [REST Examples](./docs/REST.md)
- 🛰️ [WebSocket Realtime](./docs/WS.md)
- 📬 [Webhooks](./docs/WEBHOOKS.md)
- 🆘 [Troubleshooting](./docs/TROUBLESHOOTING.md)
- 🤝 [Contributing & Commits](./docs/CONTRIBUTING.md)

## 🪪 License
MIT (or your preferred license)
