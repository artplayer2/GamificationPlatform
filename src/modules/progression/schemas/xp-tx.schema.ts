import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type XpTxDocument = HydratedDocument<XpTx>;

@Schema({ timestamps: true })
export class XpTx {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    playerId!: string;

    @Prop({ required: true })
    amount!: number;

    @Prop({ required: true })
    reason!: string;

    @Prop({ required: true })
    idempotencyKey!: string;

    // snapshot do resultado para idempotência "forte"
    @Prop({ type: Object })
    resultSnapshot?: any;
}

export const XpTxSchema = SchemaFactory.createForClass(XpTx);

// idempotência por tenant + chave
XpTxSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
