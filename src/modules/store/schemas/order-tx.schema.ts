import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderTxDocument = HydratedDocument<OrderTx>;

@Schema({ timestamps: true })
export class OrderTx {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    idempotencyKey!: string;

    @Prop({ type: Object })
    resultSnapshot?: any;
}
export const OrderTxSchema = SchemaFactory.createForClass(OrderTx);
OrderTxSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
