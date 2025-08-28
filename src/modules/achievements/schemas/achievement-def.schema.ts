import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AchievementDefDocument = HydratedDocument<AchievementDef>;

/**
 * Definição de Achievement, por PROJETO.
 * type = 'xp_threshold' (MVP) → desbloqueia quando player.xp >= minXp
 */
@Schema({ timestamps: true })
export class AchievementDef {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true }) // único por tenant+project+code
    code!: string;

    @Prop({ required: true })
    title!: string;

    @Prop()
    description?: string;

    @Prop()
    imageUrl?: string;

    @Prop({ required: true, enum: ['xp_threshold', 'counter_threshold'] })
    type!: 'xp_threshold' | 'counter_threshold';

    // xp_threshold
    @Prop({ required: false, min: 0 })
    minXp?: number;

    // counter_threshold
    @Prop({ required: false })
    counterName?: string;

    @Prop({ required: false, min: 1 })
    counterMin?: number;


}

export const AchievementDefSchema = SchemaFactory.createForClass(AchievementDef);
AchievementDefSchema.index({ tenantId: 1, projectId: 1, code: 1 }, { unique: true });
