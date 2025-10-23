import { Module } from '@nestjs/common';
import { ClientMetricsController } from './controllers/metrics.controller';
import { ClientMetricsService } from './services/metrics.service';
import { EventsModule } from '../events/events.module';
import { ApiKeysModule } from '../apikeys/apikeys.module';
import { PlayersModule } from '../players/players.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { ClientPlayersController } from './controllers/players.controller';
import { ClientLeaderboardsController } from './controllers/leaderboards.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { EmailModule } from '../email/email.module';
import { ClientAccountController } from './controllers/account.controller';
import { ClientUsersController } from './controllers/users.controller';

@Module({
  imports: [EventsModule, ApiKeysModule, PlayersModule, AchievementsModule, TenantsModule, EmailModule],
  controllers: [ClientMetricsController, ClientPlayersController, ClientLeaderboardsController, ClientAccountController, ClientUsersController],
  providers: [ClientMetricsService],
})
export class ClientModule {}