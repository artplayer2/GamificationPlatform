import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SkuDocument = HydratedDocument<Sku>;

@Schema({ timestamps: true })
export class Sku {
    @Prop({ required: true, index: true })
    tenantId!: string;

    @Prop({ required: true, index: true })
    projectId!: string;

    @Prop({ required: true })
    code!: string;

    @Prop({ required: true })
    title!: string;

    @Prop()
    description?: string;

    @Prop({ default: 0, min: 0 })
    priceSoft!: number;

    @Prop({ default: 0, min: 0 })
    priceHard!: number;

    @Prop({
        type: [
            {
                code: { type: String, required: true },
                qty: { type: Number, required: true, min: 1 },
            },
        ],
        default: [],
    })
    items!: Array<{ code: string; qty: number }>;

    @Prop()
    imageUrl?: string;

    @Prop()
    createdAt?: Date;

    @Prop()
    updatedAt?: Date;
}
export const SkuSchema = SchemaFactory.createForClass(Sku);
SkuSchema.index({ tenantId: 1, projectId: 1, code: 1 }, { unique: true });
