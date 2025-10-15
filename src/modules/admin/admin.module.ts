import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminMetricsController } from './controllers/metrics.controller';
import { AdminPlansController } from './controllers/plans.controller';
import { AdminMetricsService } from './services/metrics.service';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { WebhookDelivery, WebhookDeliverySchema } from '../webhooks/schemas/webhook-delivery.schema';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    PlansModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Player.name, schema: PlayerSchema },
      { name: Event.name, schema: EventSchema },
      { name: WebhookDelivery.name, schema: WebhookDeliverySchema },
    ]),
  ],
  controllers: [AdminMetricsController, AdminPlansController],
  providers: [AdminMetricsService],
})
export class AdminModule {}