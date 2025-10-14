import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { Tx, TxSchema } from './schemas/tx.schema';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Player.name, schema: PlayerSchema },
            { name: Tx.name, schema: TxSchema },
        ]),
        forwardRef(() => EventsModule),
    ],
    controllers: [InventoryController],
    providers: [InventoryService],
})
export class InventoryModule {}
