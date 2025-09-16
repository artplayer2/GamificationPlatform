import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './modules/health/health.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PlayersModule } from './modules/players/players.module';
import { ProgressionModule } from './modules/progression/progression.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { CountersModule } from './modules/counters/counters.module';
import {EventsModule} from "./modules/events/events.module";
import {QuestsModule} from "./modules/quests/quests.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27017/gamification'),
    HealthModule,
    TenantModule,
    ProjectsModule,
    PlayersModule,
    ProgressionModule,
    InventoryModule,
    AchievementsModule,
    CountersModule,
    EventsModule,
    QuestsModule
  ],
})
export class AppModule {}
