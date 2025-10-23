import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AvatarDocument = HydratedDocument<Avatar>;

@Schema({ timestamps: true })
export class Avatar {
  @Prop({ required: true, index: true })
  tenantId!: string;

  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, index: true })
  playerId!: string;

  @Prop({ required: true, unique: true, index: true })
  shortKey!: string; // ex.: av_8char

  @Prop({ required: true })
  s3Key!: string; // ex.: avatars/av_8char.png

  @Prop({ required: true })
  contentType!: string; // image/png, image/jpeg, image/webp

  @Prop({ required: true })
  sizeBytes!: number;

  @Prop({ required: true })
  width!: number;

  @Prop({ required: true })
  height!: number;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
AvatarSchema.index({ tenantId: 1, projectId: 1, playerId: 1 });