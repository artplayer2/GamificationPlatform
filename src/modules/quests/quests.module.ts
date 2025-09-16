import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestsController } from './quests.controller';
import { QuestsService } from './quests.service';
import { QuestDef, QuestDefSchema } from './schemas/quest-def.schema';
import { PlayerQuest, PlayerQuestSchema } from './schemas/player-quest.schema';
import { QuestTx, QuestTxSchema } from './schemas/quest-tx.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { ProgressionCurve, ProgressionCurveSchema } from '../progression/schemas/curve.schema';
import { AchievementsModule } from '../achievements/achievements.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: QuestDef.name, schema: QuestDefSchema },
            { name: PlayerQuest.name, schema: PlayerQuestSchema },
            { name: QuestTx.name, schema: QuestTxSchema },
            { name: Project.name, schema: ProjectSchema },
            { name: Player.name, schema: PlayerSchema },
            { name: ProgressionCurve.name, schema: ProgressionCurveSchema },
        ]),
        AchievementsModule,
        EventsModule,
    ],
    controllers: [QuestsController],
    providers: [QuestsService],
})
export class QuestsModule {}
