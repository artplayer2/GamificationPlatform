import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schemas/event.schema';
import { EventsService } from './events.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Event.name, schema: EventSchema },
            { name: Project.name, schema: ProjectSchema },
        ]),
        forwardRef(() => WebhooksModule),
        RealtimeModule, // 👈 habilita injetar RealtimeService
    ],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule {}
