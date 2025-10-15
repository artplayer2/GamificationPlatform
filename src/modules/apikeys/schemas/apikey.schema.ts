import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApiKeyDocument = HydratedDocument<ApiKey>;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ required: true, index: true })
  tenantId!: string;

  @Prop({ type: String, index: true, required: false, default: null })
  projectId?: string | null;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, index: true })
  prefix!: string; // first characters for display

  @Prop({ required: true, unique: true })
  hash!: string; // sha256 of full key

  @Prop({ type: [String], default: [] })
  roles!: string[]; // owner, developer, analyst, service

  @Prop({ type: [String], default: [] })
  scopes!: string[]; // e.g., read:*, write:events

  @Prop({ default: true, index: true })
  active!: boolean;

  @Prop({ type: Date, required: false, default: null })
  revokedAt?: Date | null;

  @Prop({ type: Date, required: false, default: null })
  expiresAt?: Date | null;

  @Prop({ default: 600 })
  rateLimitPerMin?: number; // simple global per-key limit

  @Prop({ type: Date, required: false, default: null })
  lastUsedAt?: Date | null;

  @Prop({ default: 0 })
  usageCount?: number;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
ApiKeySchema.index({ tenantId: 1, projectId: 1, active: 1 });