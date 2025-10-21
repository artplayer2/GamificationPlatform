"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const body_parser_1 = require("body-parser");
const crypto_1 = require("crypto");
const SECRET = process.env.WEBHOOK_SECRET || 'minha_chave_super_secreta_123456';
const PORT = Number(process.env.PORT || 4000);
const app = (0, express_1.default)();
app.use(body_parser_1.default.json({
    verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); }
}));
function verifySignature(rawBody, header, secret) {
    const m = /t=(\d+),v1=([a-f0-9]+)/i.exec(header || '');
    if (!m)
        return false;
    const [_, t, v1] = m;
    const expected = crypto_1.default.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
    try {
        return crypto_1.default.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
    }
    catch {
        return false;
    }
}
app.get('/health', (_req, res) => res.json({ ok: true }));
app.post('/webhook-test', (req, res) => {
    const ok = verifySignature(req.rawBody || '', req.headers['x-webhook-signature'], SECRET);
    console.log('--- WEBHOOK --- validSig:', ok, 'type:', req.headers['x-event-type']);
    if (!ok)
        return res.status(401).json({ ok: false, error: 'invalid signature' });
    console.log('Headers:', {
        tenant: req.headers['x-tenant-id'],
        project: req.headers['x-project-id'],
        timestamp: req.headers['x-webhook-timestamp'],
    });
    console.log('Body:', req.body);
    res.status(200).json({ ok: true });
});
app.listen(PORT, () => console.log(`Receiver running on http://localhost:${PORT}/webhook-test`));
