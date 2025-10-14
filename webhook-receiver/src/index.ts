import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';

const SECRET = process.env.WEBHOOK_SECRET || 'minha_chave_super_secreta_123456';
const PORT = Number(process.env.PORT || 4000);

const app = express();
app.use(bodyParser.json({
    verify: (req: any, _res, buf) => { req.rawBody = buf.toString('utf8'); }
}));

function verifySignature(rawBody: string, header: string | undefined, secret: string) {
    const m = /t=(\d+),v1=([a-f0-9]+)/i.exec(header || '');
    if (!m) return false;
    const [_, t, v1] = m;
    const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected,'hex'), Buffer.from(v1,'hex'));
    } catch { return false; }
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/webhook-test', (req: any, res) => {
    const ok = verifySignature(req.rawBody || '', req.headers['x-webhook-signature'] as string, SECRET);
    console.log('--- WEBHOOK --- validSig:', ok, 'type:', req.headers['x-event-type']);
    if (!ok) return res.status(401).json({ ok: false, error: 'invalid signature' });

    console.log('Headers:', {
        tenant: req.headers['x-tenant-id'],
        project: req.headers['x-project-id'],
        timestamp: req.headers['x-webhook-timestamp'],
    });
    console.log('Body:', req.body);

    res.status(200).json({ ok: true });
});

app.listen(PORT, () => console.log(`Receiver running on http://localhost:${PORT}/webhook-test`));
