import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { Player, PlayerSchema } from './schemas/player.schema';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Player.name, schema: PlayerSchema }]),
        forwardRef(() => EventsModule),
    ],
    controllers: [PlayersController],
    providers: [PlayersService],
    exports: [PlayersService],
})
export class PlayersModule {}
