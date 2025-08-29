import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AchievementDefDocument = HydratedDocument<AchievementDef>;

/**
 * Definição de Achievement por PROJETO.
 * Tipos suportados no MVP:
 *  - xp_threshold: desbloqueia quando player.xp >= minXp
 *  - counter_threshold: quando um contador (counterName) atingir counterMin
 */
@Schema({ timestamps: true })
export class AchievementDef {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true })
    code!: string; // único por tenant+project

    @Prop({ required: true })
    title!: string;

    @Prop()
    description?: string;

    @Prop()
    imageUrl?: string;

    @Prop({ required: true, enum: ['xp_threshold', 'counter_threshold'] })
    type!: 'xp_threshold' | 'counter_threshold';

    // xp_threshold
    @Prop({ min: 0 })
    minXp?: number;

    // counter_threshold
    @Prop()
    counterName?: string;

    @Prop({ min: 1 })
    counterMin?: number;
}

export const AchievementDefSchema = SchemaFactory.createForClass(AchievementDef);

// unicidade por tenant+project+code
AchievementDefSchema.index({ tenantId: 1, projectId: 1, code: 1 }, { unique: true });
