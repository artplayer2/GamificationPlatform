import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, index: true })
    playerId!: string;

    @Prop({ required: true })
    skuCode!: string;

    @Prop({ default: 1, min: 1 })
    qty!: number;

    @Prop({ default: 0 })
    paidSoft!: number;

    @Prop({ default: 0 })
    paidHard!: number;

    @Prop({ type: Array, default: [] })
    items!: Array<{ code: string; qty: number }>;

    @Prop()
    idempotencyKey!: string;
}
export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
