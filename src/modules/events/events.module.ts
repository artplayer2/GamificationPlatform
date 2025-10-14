import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schemas/event.schema';
import { EventsService } from './events.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
        forwardRef(() => WebhooksModule),
    ],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule {}
