import { Injectable, Logger } from '@nestjs/common';
import type { WebSocket } from 'ws';
import { ClientInfo, ClientMessage } from './realtime.types';

@Injectable()
export class RealtimeService {
    private readonly logger = new Logger(RealtimeService.name);
    private clients = new Map<WebSocket, ClientInfo>();

    get size() {
        return this.clients.size;
    }

    registerClient(ws: WebSocket, info: ClientInfo) {
        this.clients.set(ws, info);

        ws.on('message', (data: Buffer) => {
            const raw = data.toString('utf8');
            this.handleClientMessage(ws, raw);
        });

        ws.on('close', () => {
            this.clients.delete(ws);
        });
    }

    unregisterClient(ws: WebSocket) {
        this.clients.delete(ws);
    }

    private send(ws: WebSocket, msg: any) {
        try { ws.send(JSON.stringify(msg)); } catch { /* ignore */ }
    }

    private parseMessage(raw: string): ClientMessage | null {
        try {
            const msg = JSON.parse(raw);
            if (!msg || typeof msg !== 'object') return null;
            return msg as ClientMessage;
        } catch {
            return null;
        }
    }

    private isValidEventType(s: any): s is string {
        return typeof s === 'string' && !!s.length && s.length <= 200;
    }

    private normalizeEventTypes(list?: string[]): string[] {
        if (!Array.isArray(list) || list.length === 0) return ['*'];
        const max = Number(process.env.REALTIME_MAX_EVENTTYPES || 50);
        const out: string[] = [];
        for (const e of list) {
            if (this.isValidEventType(e)) {
                out.push(e);
                if (out.length >= max) break;
            }
        }
        return out.length ? out : ['*'];
    }

    private handleClientMessage(ws: WebSocket, raw: string) {
        const msg = this.parseMessage(raw);
        if (!msg) return this.send(ws, { type: 'error', error: 'invalid_json' });

        const info = this.clients.get(ws);
        if (!info) return;

        if (msg.action === 'subscribe') {
            const list = this.normalizeEventTypes(msg.eventTypes);
            info.eventTypes = new Set(list);
            return this.send(ws, { type: 'subscribed', eventTypes: list });
        }

        if (msg.action === 'unsubscribe') {
            info.eventTypes.clear();
            return this.send(ws, { type: 'unsubscribed' });
        }

        if (msg.action === 'ping') {
            return this.send(ws, { type: 'pong', t: Date.now() });
        }

        if (msg.action === 'resume') {
            // placeholder para o commit de replay (commit futuro)
            const list = this.normalizeEventTypes(msg.eventTypes);
            info.eventTypes = new Set(list);
            return this.send(ws, { type: 'subscribed', eventTypes: list });
        }

        return this.send(ws, { type: 'error', error: 'unknown_action' });
    }

    publishEvent(evt: {
        tenantId: string;
        projectId: string;
        type: string;
        payload?: any;
        id?: string;
        createdAt?: string;
    }) {
        for (const [ws, info] of this.clients) {
            if (info.projectId !== evt.projectId) continue;
            if (!info.eventTypes.size) continue;
            if (!info.eventTypes.has('*') && !info.eventTypes.has(evt.type)) continue;

            const msg = {
                id: evt.id || undefined,
                type: evt.type,
                tenantId: evt.tenantId,
                projectId: evt.projectId,
                payload: evt.payload ?? null,
                createdAt: evt.createdAt || new Date().toISOString(),
                channel: 'ws',
            };

            this.send(ws, msg);
        }
    }
}
