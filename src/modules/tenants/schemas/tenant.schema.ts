import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, unique: true })
  code!: string; // e.g., "demo"

  @Prop({ required: true })
  name!: string; // e.g., "Demo Tenant"

  @Prop({ default: 'free' })
  plan?: string; // plan code (free|pro|enterprise)

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  // Mongoose document _id present on lean() and create() results
  _id?: any;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);