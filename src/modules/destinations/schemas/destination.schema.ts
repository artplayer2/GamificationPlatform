import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type DestinationDocument = HydratedDocument<Destination>;

@Schema({ timestamps: true })
export class Destination {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, enum: ['webhook','websocket'], index: true })
    type!: 'webhook' | 'websocket';

    @Prop({ type: [String], required: true })
    eventTypes!: string[];

    @Prop({ default: true, index: true })
    active!: boolean;

    // webhook-specific
    @Prop()
    url?: string;

    @Prop()
    secret?: string;
}

export const DestinationSchema = SchemaFactory.createForClass(Destination);
DestinationSchema.index({ tenantId: 1, projectId: 1, type: 1, active: 1 });
