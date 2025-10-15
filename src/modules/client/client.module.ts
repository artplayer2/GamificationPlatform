import { Module } from '@nestjs/common';
import { ClientMetricsController } from './controllers/metrics.controller';
import { ClientMetricsService } from './services/metrics.service';
import { EventsModule } from '../events/events.module';
import { ApiKeysModule } from '../apikeys/apikeys.module';

@Module({
  imports: [EventsModule, ApiKeysModule],
  controllers: [ClientMetricsController],
  providers: [ClientMetricsService],
})
export class ClientModule {}