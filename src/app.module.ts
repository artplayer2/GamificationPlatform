import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './modules/health/health.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PlayersModule } from './modules/players/players.module';
import { ProgressionModule } from './modules/progression/progression.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27017/gamification'),
    HealthModule,
    TenantModule,
    ProjectsModule,
    PlayersModule,
    ProgressionModule,
  ],
})
export class AppModule {}
