import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ _id: false })
class PlanLimits {
  @Prop({ type: Number, default: 300 })
  restMaxReqPerMin!: number;

  @Prop({ type: Number, default: 1000 })
  wsMaxClients!: number;

  @Prop({ type: Number, default: 50 })
  wsMaxEventTypes!: number;

  @Prop({ type: Number, default: 5000 })
  webhookTimeoutMs!: number;

  @Prop({ type: Number, default: 600 })
  webhooksMaxPerMin!: number;

  @Prop({ type: Number, default: 100000 })
  storageMaxEvents!: number;

  @Prop({ type: Number, default: 100000 })
  storageMaxPlayers!: number;
}

const PlanLimitsSchema = SchemaFactory.createForClass(PlanLimits);

@Schema({ _id: false })
class PlanFeatures {
  @Prop({ type: Boolean, default: true })
  realtimeEnabled!: boolean;

  @Prop({ type: Boolean, default: true })
  webhooksEnabled!: boolean;

  @Prop({ type: Boolean, default: true })
  storeEnabled!: boolean;

  @Prop({ type: Boolean, default: true })
  questsEnabled!: boolean;

  @Prop({ type: Boolean, default: true })
  achievementsEnabled!: boolean;

  @Prop({ type: Boolean, default: true })
  inventoryEnabled!: boolean;

  @Prop({ type: Boolean, default: true })
  countersEnabled!: boolean;
}

const PlanFeaturesSchema = SchemaFactory.createForClass(PlanFeatures);

@Schema({ timestamps: true })
export class Plan {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true })
  code!: string; // e.g.: 'free', 'pro', 'enterprise'

  @Prop({ type: PlanLimitsSchema, required: true })
  limits!: PlanLimits;

  @Prop({ type: PlanFeaturesSchema, required: true })
  features!: PlanFeatures;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);