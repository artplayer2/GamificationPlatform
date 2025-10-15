# WebSocket Realtime

Gateway: `ws://<host>:<port>/realtime`

## Connect (query or headers)
```
x-api-key    : REALTIME_DEV_API_KEY
x-tenant-id  : <TENANT>
x-project-id : <PROJECT_ID>
```
### wscat
```bash
npx wscat -c "ws://localhost:3000/realtime?x-api-key=dev-api-key&x-project-id=<PROJECT_ID>&x-tenant-id=demo"
```
Response:
```json
{ "type":"hello", "ok": true, "projectId":"<PROJECT_ID>" }
```

## Subscribe (required)
Send after connect:
```json
{ "action": "subscribe", "eventTypes": ["*"] }
```
Ack:
```json
{ "type": "subscribed", "eventTypes": ["*"] }
```

## Node Client Sample
```js
const WebSocket = require('ws');
const qs = new URLSearchParams({
  'x-api-key':'dev-api-key',
  'x-tenant-id':'demo',
  'x-project-id':'<PROJECT_ID>',
}).toString();

const ws = new WebSocket(`ws://localhost:3000/realtime?${qs}`);
ws.on('open', () => ws.send(JSON.stringify({ action: 'subscribe', eventTypes: ['*'] })));
ws.on('message', data => console.log('event:', data.toString()));
```
