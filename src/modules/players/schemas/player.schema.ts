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

    @Prop({
        type: {
            soft: { type: Number, default: 0 },
            hard: { type: Number, default: 0 },
        },
        default: { soft: 0, hard: 0 },
    })
    wallet!: { soft: number; hard: number };
}


export const PlayerSchema = SchemaFactory.createForClass(Player);
PlayerSchema.index({ tenantId: 1, projectId: 1, username: 1 }, { unique: true });
