import { Injectable, Optional, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { WebhooksService } from '../webhooks/webhooks.service'; // 👈 ADD

@Injectable()
export class EventsService {
    constructor(
        @InjectModel(Event.name) private eventModel: Model<EventDocument>,
        @Optional() @Inject(forwardRef(() => WebhooksService)) private webhooks?: WebhooksService,
    ) {}

    async log(params: {
        tenantId: string;
        projectId: string;
        type: string;
        playerId?: string;
        payload?: any;
    }) {
        const event = await this.eventModel.create({
            tenantId: params.tenantId,
            projectId: params.projectId,
            type: params.type,
            playerId: params.playerId,
            payload: params.payload ?? null,
        });

        // 👇 Enfileira entregas (se módulo de webhooks estiver presente)
        if (this.webhooks) {
            await this.webhooks.enqueueForEvent({
                tenantId: params.tenantId,
                projectId: params.projectId,
                eventId: event._id.toString(),
                eventType: params.type,
                payload: {
                    playerId: params.playerId ?? null,
                    ...((params.payload && typeof params.payload === 'object') ? params.payload : { value: params.payload }),
                },
            });
        }

        return { id: event._id.toString(), createdAt: event.createdAt, ...params };
    }
}
