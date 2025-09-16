import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlayerQuestDocument = HydratedDocument<PlayerQuest>;

@Schema({ timestamps: true })
export class PlayerQuest {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, index: true })
    playerId!: string;

    @Prop({ required: true })
    code!: string; // quest code

    @Prop({ default: 'completed' })
    status!: 'completed'; // MVP: só estado final

    @Prop()
    completedAt?: Date;

    @Prop({ type: Object })
    context?: Record<string, any>;
}

export const PlayerQuestSchema = SchemaFactory.createForClass(PlayerQuest);
PlayerQuestSchema.index({ tenantId: 1, projectId: 1, playerId: 1, code: 1 }, { unique: true });
