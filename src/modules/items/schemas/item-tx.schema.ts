import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ItemTxDocument = HydratedDocument<ItemTx>;

@Schema({ timestamps: true })
export class ItemTx {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    idempotencyKey!: string;

    @Prop({ required: true })
    type!: 'grant' | 'consume';

    @Prop({ type: Object })
    payload?: any;

    @Prop()
    createdAt?: Date;
}

export const ItemTxSchema = SchemaFactory.createForClass(ItemTx);
ItemTxSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
