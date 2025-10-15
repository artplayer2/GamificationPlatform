export type ClientMessage =
    | { action: 'subscribe'; eventTypes?: string[] } // se vazio/omitido => ["*"]
    | { action: 'unsubscribe' }
    | { action: 'ping' }
    | { action: 'resume'; since: string; eventTypes?: string[] } // reservado p/ futuro (replay)

export type ServerMessage =
    | { type: 'hello'; ok: true; projectId: string }
    | { type: 'subscribed'; eventTypes: string[] }
    | { type: 'unsubscribed' }
    | { type: 'pong'; t: number }
    | { type: 'error'; error: string; details?: any };

export type ClientInfo = {
    tenantId: string;
    projectId: string;
    eventTypes: Set<string>; // vazio = sem assinatura, "*" = todos
};