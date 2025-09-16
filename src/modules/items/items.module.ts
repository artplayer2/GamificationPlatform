import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { ItemDef, ItemDefSchema } from './schemas/item-def.schema';
import { PlayerItem, PlayerItemSchema } from './schemas/player-item.schema';
import { ItemTx, ItemTxSchema } from './schemas/item-tx.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ItemDef.name, schema: ItemDefSchema },
            { name: PlayerItem.name, schema: PlayerItemSchema },
            { name: ItemTx.name, schema: ItemTxSchema },
            { name: Project.name, schema: ProjectSchema },
            { name: Player.name, schema: PlayerSchema },
        ]),
        EventsModule,
    ],
    controllers: [ItemsController],
    providers: [ItemsService],
    exports: [ItemsService],
})
export class ItemsModule {}
