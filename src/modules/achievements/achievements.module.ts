import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { AchievementDef, AchievementDefSchema } from './schemas/achievement-def.schema';
import { PlayerAchievement, PlayerAchievementSchema } from './schemas/player-achievement.schema';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AchievementDef.name, schema: AchievementDefSchema },
            { name: PlayerAchievement.name, schema: PlayerAchievementSchema },
            { name: Player.name, schema: PlayerSchema },
            { name: Project.name, schema: ProjectSchema },
        ]),
        EventsModule, // 👈 para logar eventos
    ],
    controllers: [AchievementsController],
    providers: [AchievementsService],
    exports: [AchievementsService],
})
export class AchievementsModule {}
