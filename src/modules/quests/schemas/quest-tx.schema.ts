import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestTxDocument = HydratedDocument<QuestTx>;

@Schema({ timestamps: true })
export class QuestTx {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, index: true })
    playerId!: string;

    @Prop({ required: true })
    code!: string; // quest code

    @Prop({ required: true })
    idempotencyKey!: string;

    @Prop({ type: Object })
    resultSnapshot?: any;
}

export const QuestTxSchema = SchemaFactory.createForClass(QuestTx);
QuestTxSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
