import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlayerItemDocument = HydratedDocument<PlayerItem>;

@Schema({ timestamps: true })
export class PlayerItem {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, index: true })
    playerId!: string;

    @Prop({ required: true, index: true })
    code!: string;

    @Prop({ default: 0, min: 0 })
    qty!: number;

    @Prop()
    createdAt?: Date;

    @Prop()
    updatedAt?: Date;
}

export const PlayerItemSchema = SchemaFactory.createForClass(PlayerItem);
PlayerItemSchema.index({ tenantId: 1, projectId: 1, playerId: 1, code: 1 }, { unique: true });
