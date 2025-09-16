import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Event {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, index: true })
    type!: string; // ex.: 'achievement.unlocked'

    @Prop()
    playerId?: string;

    @Prop({ type: Object })
    payload?: any;

    @Prop()
    createdAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
EventSchema.index({ tenantId: 1, projectId: 1, createdAt: -1 });
