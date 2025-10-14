import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export type WebhookDeliveryDocument = HydratedDocument<WebhookDelivery>;

type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'dead';

@Schema({ timestamps: true })
export class WebhookDelivery {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, index: true })
    subscriptionId!: string;

    @Prop({ required: true, index: true })
    eventId!: string;

    @Prop({ required: true })
    eventType!: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    payload?: any;

    @Prop({ default: 'pending', index: true })
    status!: DeliveryStatus;

    @Prop({ default: 0 })
    attempts!: number;

    @Prop({ default: 6 })
    maxAttempts!: number;

    @Prop({ default: () => new Date(), index: true })
    nextAttemptAt!: Date;

    @Prop()
    lastError?: string;

    @Prop()
    responseStatus?: number;

    @Prop({ type: MongooseSchema.Types.Mixed })
    responseBody?: any;
}

export const WebhookDeliverySchema = SchemaFactory.createForClass(WebhookDelivery);
WebhookDeliverySchema.index({ subscriptionId: 1, eventId: 1 }, { unique: true });
WebhookDeliverySchema.index({ status: 1, nextAttemptAt: 1 });
