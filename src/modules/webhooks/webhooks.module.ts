import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksService } from './webhooks.service';
import { WebhooksWorker } from './webhooks.worker';
import { WebhooksController } from './webhooks.controller';
import { WebhookSubscription, WebhookSubscriptionSchema } from './schemas/webhook-subscription.schema';
import { WebhookDelivery, WebhookDeliverySchema } from './schemas/webhook-delivery.schema';
import { EventsModule } from '../events/events.module';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ApiKeysModule } from '../apikeys/apikeys.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: WebhookSubscription.name, schema: WebhookSubscriptionSchema },
            { name: WebhookDelivery.name, schema: WebhookDeliverySchema },
            { name: Project.name, schema: ProjectSchema }, // 👈 necessário p/ ensureProject
        ]),
        forwardRef(() => EventsModule),
        ApiKeysModule,
    ],
    providers: [WebhooksService, WebhooksWorker],
    controllers: [WebhooksController],
    exports: [WebhooksService],
})
export class WebhooksModule {}
