import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestDefDocument = HydratedDocument<QuestDef>;

@Schema({ timestamps: true })
export class QuestDef {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true })
    code!: string; // único por projeto

    @Prop({ required: true })
    title!: string;

    @Prop()
    description?: string;

    @Prop({ default: 0, min: 0 })
    rewardXp!: number;

    @Prop({ default: 0, min: 0 })
    rewardSoft!: number;

    @Prop({ default: 0, min: 0 })
    rewardHard!: number;

    @Prop({ type: Object })
    metadata?: Record<string, any>;

    @Prop()
    createdAt?: Date;

    @Prop()
    updatedAt?: Date;
}

export const QuestDefSchema = SchemaFactory.createForClass(QuestDef);
QuestDefSchema.index({ tenantId: 1, projectId: 1, code: 1 }, { unique: true });
