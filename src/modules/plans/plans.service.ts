import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from './schemas/plan.schema';

export interface CreatePlanInput {
  name: string;
  code: string;
  limits?: Partial<Plan['limits']>;
  features?: Partial<Plan['features']>;
}

export interface UpdatePlanInput {
  name?: string;
  limits?: Partial<Plan['limits']>;
  features?: Partial<Plan['features']>;
}

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plan.name) private readonly plans: Model<PlanDocument>,
  ) {}

  async create(input: CreatePlanInput) {
    const doc = await this.plans.create({
      name: input.name,
      code: input.code,
      limits: {
        restMaxReqPerMin: 300,
        wsMaxClients: 1000,
        wsMaxEventTypes: 50,
        webhookTimeoutMs: 5000,
        webhooksMaxPerMin: 600,
        storageMaxEvents: 100000,
        storageMaxPlayers: 100000,
        ...(input.limits || {}),
      },
      features: {
        realtimeEnabled: true,
        webhooksEnabled: true,
        storeEnabled: true,
        questsEnabled: true,
        achievementsEnabled: true,
        inventoryEnabled: true,
        countersEnabled: true,
        ...(input.features || {}),
      },
    });
    return doc;
  }

  async list() {
    return this.plans.find({}).sort({ createdAt: -1 }).lean();
  }

  async get(id: string) {
    const doc = await this.plans.findById(id).lean();
    if (!doc) throw new NotFoundException('Plan not found');
    return doc;
  }

  async update(id: string, input: UpdatePlanInput) {
    const doc = await this.plans.findById(id);
    if (!doc) throw new NotFoundException('Plan not found');
    if (input.name !== undefined) doc.name = input.name as any;
    if (input.limits) doc.limits = { ...doc.limits, ...input.limits } as any;
    if (input.features) doc.features = { ...doc.features, ...input.features } as any;
    await doc.save();
    return doc.toObject();
  }

  async remove(id: string) {
    const res = await this.plans.findByIdAndDelete(id).lean();
    if (!res) throw new NotFoundException('Plan not found');
    return { ok: true };
  }
}