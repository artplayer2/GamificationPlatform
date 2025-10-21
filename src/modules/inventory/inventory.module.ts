import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Tx, TxSchema } from './schemas/tx.schema';
import { EventsModule } from '../events/events.module';
import { PlansModule } from '../plans/plans.module';
import { ApiKeysModule } from '../apikeys/apikeys.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Player.name, schema: PlayerSchema },
            { name: Project.name, schema: ProjectSchema },
            { name: Tx.name, schema: TxSchema },
        ]),
        forwardRef(() => EventsModule),
        PlansModule,
        ApiKeysModule,
    ],
    controllers: [InventoryController],
    providers: [InventoryService],
})
export class InventoryModule {}
