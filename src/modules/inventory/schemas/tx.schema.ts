import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TxDocument = HydratedDocument<Tx>;

@Schema({ timestamps: true })
export class Tx {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    playerId!: string;

    @Prop({ required: true, enum: ['soft', 'hard'] })
    currency!: 'soft' | 'hard';

    @Prop({ required: true, enum: ['credit', 'debit'] })
    type!: 'credit' | 'debit';

    @Prop({ required: true, min: 1 })
    amount!: number;

    @Prop({ required: true, unique: false })
    idempotencyKey!: string;

    @Prop({ required: false })
    reason?: string;
}

export const TxSchema = SchemaFactory.createForClass(Tx);

// Garantir idempotência por tenant + chave
TxSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
