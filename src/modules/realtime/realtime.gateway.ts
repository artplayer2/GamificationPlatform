import {
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { RealtimeService } from './realtime.service';
import { ApiKeysService } from '../apikeys/apikeys.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

function headerOf(req: IncomingMessage, name: string): string | undefined {
    return (req.headers[name.toLowerCase()] as string | undefined) ?? undefined;
}

function fromQuery(req: IncomingMessage, key: string): string | undefined {
    try {
        const u = new URL(req.url || '', 'http://localhost');
        return u.searchParams.get(key) ?? undefined;
    } catch {
        return undefined;
    }
}

@WebSocketGateway({
    path: '/realtime',
    cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly realtime: RealtimeService,
        private readonly apiKeys: ApiKeysService,
        @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    ) {}

    private close(client: WebSocket, code: number, reason: string) {
        try { client.close(code as any, reason); } catch {}
    }

    async handleConnection(client: WebSocket, req: IncomingMessage) {
        const maxClients = Number(process.env.REALTIME_MAX_CLIENTS || 1000);
        if (this.realtime.size >= maxClients) {
            return this.close(client, 4009, 'too_many_connections');
        }

        // 1) headers
        let apiKey    = headerOf(req, 'x-api-key');
        let projectId = headerOf(req, 'x-project-id');
        let tenantId  = headerOf(req, 'x-tenant-id');

        // 2) fallback query string
        if (!apiKey)    apiKey    = fromQuery(req, 'x-api-key');
        if (!projectId) projectId = fromQuery(req, 'x-project-id');
        if (!tenantId)  tenantId  = fromQuery(req, 'x-tenant-id');

        if (!apiKey || !projectId || !tenantId) {
            return this.close(client, 4001, 'missing_headers');
        }

        // validação do API key: aceita fallback de DEV somente se configurado
        const devExpected = process.env.REALTIME_DEV_API_KEY;
        let valid = false;
        if (devExpected && apiKey === devExpected) {
            valid = true;
        } else {
            const v = await this.apiKeys.verify(String(tenantId), String(projectId), String(apiKey));
            valid = !!v;
        }
        if (!valid) {
            return this.close(client, 4003, 'invalid_api_key');
        }

        if (!Types.ObjectId.isValid(projectId)) {
            return this.close(client, 4002, 'invalid_project_id');
        }

        const p = await this.projectModel.findById(projectId).lean().exec();
        if (!p) {
            return this.close(client, 4004, 'project_not_found_for_tenant');
        }
        const reqTenant = String(tenantId).trim().toLowerCase();
        const projTenant = String((p as any).tenantId ?? '').trim().toLowerCase();
        if (!projTenant || projTenant !== reqTenant) {
            return this.close(client, 4004, 'project_not_found_for_tenant');
        }

        // Registro do cliente (aguarda subscribe)
        this.realtime.registerClient(client, {
            tenantId: String(tenantId),
            projectId: String(projectId),
            eventTypes: new Set<string>(),
        });

        try {
            client.send(JSON.stringify({ type: 'hello', ok: true, projectId }));
        } catch {}
    }

    async handleDisconnect(client: WebSocket) {
        this.realtime.unregisterClient(client);
    }
}
