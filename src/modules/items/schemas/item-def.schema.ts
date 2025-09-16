import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ItemDefDocument = HydratedDocument<ItemDef>;

@Schema({ timestamps: true })
export class ItemDef {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true })
    code!: string;

    @Prop({ required: true })
    name!: string;

    @Prop()
    description?: string;

    @Prop({ default: true })
    stackable!: boolean;

    @Prop({ default: 'consumable' })
    type!: string;

    @Prop()
    imageUrl?: string;

    @Prop()
    createdAt?: Date;

    @Prop()
    updatedAt?: Date;
}

export const ItemDefSchema = SchemaFactory.createForClass(ItemDef);
ItemDefSchema.index({ tenantId: 1, projectId: 1, code: 1 }, { unique: true });
