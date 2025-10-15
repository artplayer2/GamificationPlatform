# Webhooks

Deliveries are **enqueued** when an event is created and processed by a **Cron Worker** every **5s** with retry/backoff and **HMAC** signing.

## Local Receiver (example)
```js
// receiver.js
const http = require('http');
const server = http.createServer((req, res) => {
  let body = [];
  req.on('data', c => body.push(c));
  req.on('end', () => {
    body = Buffer.concat(body).toString();
    console.log('> webhook:', req.url, body);
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ ok:true }));
  });
});
server.listen(3005, () => console.log('Receiver on http://localhost:3005/webhooks'));
```
Run:
```bash
node receiver.js
```
## Subscribe
`POST /v1/webhooks/subscriptions`
```json
{
  "projectId":"<PROJECT_ID>",
  "url":"http://localhost:3005/webhooks",
  "secret":"whsec_9a87c1f2f3a54d0e",
  "eventTypes":["player.created","player.levelup","store.purchase.succeeded"],
  "active": true
}
```
