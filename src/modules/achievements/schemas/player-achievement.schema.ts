import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlayerAchievementDocument = HydratedDocument<PlayerAchievement>;

@Schema({ timestamps: true })
export class PlayerAchievement {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, index: true })
    playerId!: string;

    @Prop({ required: true })
    code!: string; // code da AchievementDef

    @Prop({ default: Date.now })
    unlockedAt!: Date;
}

export const PlayerAchievementSchema = SchemaFactory.createForClass(PlayerAchievement);
PlayerAchievementSchema.index(
    { tenantId: 1, projectId: 1, playerId: 1, code: 1 },
    { unique: true }, // impede duplicar o unlock
);
