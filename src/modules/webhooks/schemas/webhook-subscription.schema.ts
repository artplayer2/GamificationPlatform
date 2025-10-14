import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookSubscriptionDocument = HydratedDocument<WebhookSubscription>;

@Schema({ timestamps: true })
export class WebhookSubscription {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true })
    url!: string;

    @Prop({ required: true })
    secret!: string;

    @Prop({ type: [String], required: true })
    eventTypes!: string[];

    @Prop({ default: true, index: true })
    active!: boolean;
}

export const WebhookSubscriptionSchema = SchemaFactory.createForClass(WebhookSubscription);
WebhookSubscriptionSchema.index({ tenantId: 1, projectId: 1, active: 1 });
