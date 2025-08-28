import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountersController } from './counters.controller';
import { CountersService } from './counters.service';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { AchievementDef, AchievementDefSchema } from '../achievements/schemas/achievement-def.schema';
import { PlayerAchievement, PlayerAchievementSchema } from '../achievements/schemas/player-achievement.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Counter.name, schema: CounterSchema },
            { name: AchievementDef.name, schema: AchievementDefSchema },
            { name: PlayerAchievement.name, schema: PlayerAchievementSchema },
        ]),
    ],
    controllers: [CountersController],
    providers: [CountersService],
})
export class CountersModule {}
