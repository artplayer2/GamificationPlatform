import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

@Schema({ timestamps: true })
export class Counter {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true, index: true })
    playerId!: string;

    @Prop({ required: true })
    name!: string; // ex.: "mob_kills"

    @Prop({ required: true, default: 0, min: 0 })
    value!: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
CounterSchema.index({ tenantId: 1, projectId: 1, playerId: 1, name: 1 }, { unique: true });
