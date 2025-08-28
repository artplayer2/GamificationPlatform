import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressionController } from './progression.controller';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Player.name, schema: PlayerSchema }]),
  AchievementsModule,
  ],

  controllers: [ProgressionController],

})
export class ProgressionModule {}
