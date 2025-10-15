import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { Player, PlayerSchema } from './schemas/player.schema';
import { EventsModule } from '../events/events.module';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Player.name, schema: PlayerSchema },
            { name: Project.name, schema: ProjectSchema }, // 👈 necessário p/ ensureProject
        ]),
        forwardRef(() => EventsModule),
    ],
    controllers: [PlayersController],
    providers: [PlayersService],
    exports: [PlayersService],
})
export class PlayersModule {}
