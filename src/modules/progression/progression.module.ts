import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressionController } from './progression.controller';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { XpTx, XpTxSchema } from './schemas/xp-tx.schema';
import { ProgressionCurve, ProgressionCurveSchema } from './schemas/curve.schema';
import { ProgressionCurvesController } from './curves.controller';
import { AchievementsModule } from '../achievements/achievements.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Player.name, schema: PlayerSchema },
            { name: XpTx.name, schema: XpTxSchema },
            { name: ProgressionCurve.name, schema: ProgressionCurveSchema },
        ]),
        AchievementsModule,
        forwardRef(() => EventsModule),
    ],
    controllers: [ProgressionController, ProgressionCurvesController],
})
export class ProgressionModule {}
