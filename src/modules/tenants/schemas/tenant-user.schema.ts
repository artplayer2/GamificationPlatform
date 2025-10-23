import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantUserDocument = HydratedDocument<TenantUser>;

@Schema({ timestamps: true })
export class TenantUser {
  @Prop({ required: true, index: true })
  tenantId!: string;

  @Prop({ required: true, index: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, enum: ['owner','admin','viewer'], default: 'viewer' })
  role!: 'owner' | 'admin' | 'viewer';

  @Prop()
  verifiedAt?: Date;

  @Prop()
  invitedAt?: Date;

  @Prop()
  resetTokenHash?: string;

  @Prop()
  resetTokenExpiresAt?: Date;

  @Prop()
  verifyTokenHash?: string;

  @Prop()
  verifyTokenExpiresAt?: Date;

  // Mongoose document _id present on lean() and create() results
  _id?: any;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const TenantUserSchema = SchemaFactory.createForClass(TenantUser);
TenantUserSchema.index({ tenantId: 1, email: 1 }, { unique: true });