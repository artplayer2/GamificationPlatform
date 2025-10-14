import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { Sku, SkuSchema } from './schemas/sku.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderTx, OrderTxSchema } from './schemas/order-tx.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Player, PlayerSchema } from '../players/schemas/player.schema';
import { ItemsModule } from '../items/items.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Sku.name, schema: SkuSchema },
            { name: Order.name, schema: OrderSchema },
            { name: OrderTx.name, schema: OrderTxSchema },
            { name: Project.name, schema: ProjectSchema },
            { name: Player.name, schema: PlayerSchema },
        ]),
        ItemsModule,
        EventsModule,
    ],
    controllers: [StoreController],
    providers: [StoreService],
})
export class StoreModule {}
