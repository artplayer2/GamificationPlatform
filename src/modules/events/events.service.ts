import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class EventsService {
    constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

    async log(params: {
        tenantId: string;
        projectId: string;
        type: string;
        playerId?: string;
        payload?: any;
    }) {
        await this.eventModel.create({
            tenantId: params.tenantId,
            projectId: params.projectId,
            type: params.type,
            playerId: params.playerId,
            payload: params.payload ?? {},
        });
    }
}
