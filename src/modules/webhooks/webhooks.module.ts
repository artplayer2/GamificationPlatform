import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookSubscription, WebhookSubscriptionSchema } from './schemas/webhook-subscription.schema';
import { WebhookDelivery, WebhookDeliverySchema } from './schemas/webhook-delivery.schema';
import { WebhooksWorker } from './webhooks.worker';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: WebhookSubscription.name, schema: WebhookSubscriptionSchema },
            { name: WebhookDelivery.name, schema: WebhookDeliverySchema },
        ]),
    ],
    providers: [WebhooksService, WebhooksWorker],
    controllers: [WebhooksController],
    exports: [WebhooksService],
})
export class WebhooksModule {}
