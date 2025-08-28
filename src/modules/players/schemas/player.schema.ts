import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlayerDocument = HydratedDocument<Player>;

@Schema({ timestamps: true })
export class Player {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, unique: true })
    username!: string;

    @Prop({ default: 0 })
    xp!: number;

    @Prop({ default: 1 })
    level!: number;
}


export const PlayerSchema = SchemaFactory.createForClass(Player);
