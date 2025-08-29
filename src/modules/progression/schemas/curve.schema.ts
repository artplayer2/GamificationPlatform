import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProgressionCurveDocument = HydratedDocument<ProgressionCurve>;

/**
 * Curva de XP por projeto.
 * levels[i] = XP TOTAL necessário para atingir o nível (i+1).
 * Ex.: levels = [0, 1000, 3000, 6000] → lvl1:0, lvl2:1000, lvl3:3000, lvl4:6000...
 */
@Schema({ timestamps: true })
export class ProgressionCurve {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true })
    name!: string;

    @Prop({ type: [Number], required: true })
    levels!: number[];

    @Prop({ default: false })
    isActive!: boolean;
}

export const ProgressionCurveSchema = SchemaFactory.createForClass(ProgressionCurve);
ProgressionCurveSchema.index({ tenantId: 1, projectId: 1, name: 1 }, { unique: true });
ProgressionCurveSchema.index({ tenantId: 1, projectId: 1, isActive: 1 });
