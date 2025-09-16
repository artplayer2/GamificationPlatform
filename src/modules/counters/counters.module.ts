import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountersController } from './counters.controller';
import { CountersService } from './counters.service';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { AchievementDef, AchievementDefSchema } from '../achievements/schemas/achievement-def.schema';
import { PlayerAchievement, PlayerAchievementSchema } from '../achievements/schemas/player-achievement.schema';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Counter.name, schema: CounterSchema },
            { name: AchievementDef.name, schema: AchievementDefSchema },
            { name: PlayerAchievement.name, schema: PlayerAchievementSchema },
            { name: Player.name, schema: PlayerSchema },
            { name: Project.name, schema: ProjectSchema },
        ]),
        EventsModule,
    ],
    controllers: [CountersController],
    providers: [CountersService],
})
export class CountersModule {}
