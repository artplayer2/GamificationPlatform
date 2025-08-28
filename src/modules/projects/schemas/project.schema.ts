import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true })
    name!: string;

    @Prop({ required: true, unique: true })
    publicKey!: string;

    @Prop({ required: true, unique: true })
    secretKey!: string;

    @Prop({ type: [String], default: [] })
    features!: string[];
}


export const ProjectSchema = SchemaFactory.createForClass(Project);
