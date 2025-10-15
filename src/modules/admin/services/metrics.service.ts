import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../../projects/schemas/project.schema';
import { Player, PlayerDocument } from '../../players/schemas/player.schema';
import { Event, EventDocument } from '../../events/schemas/event.schema';
import { WebhookDelivery, WebhookDeliveryDocument } from '../../webhooks/schemas/webhook-delivery.schema';

@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Player.name) private readonly playerModel: Model<PlayerDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(WebhookDelivery.name) private readonly deliveryModel: Model<WebhookDeliveryDocument>,
  ) {}

  async globalMetrics() {
    const totalProjects = await this.projectModel.estimatedDocumentCount();
    const totalPlayers = await this.playerModel.estimatedDocumentCount();
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const eventsThisMonth = await this.eventModel.countDocuments({ createdAt: { $gte: startMonth } });
    const delivered = await this.deliveryModel.countDocuments({ status: 'delivered' });
    const failed = await this.deliveryModel.countDocuments({ status: 'failed' });
    const dead = await this.deliveryModel.countDocuments({ status: 'dead' });

    return {
      totalProjects,
      totalPlayers,
      eventsThisMonth,
      webhookDeliveries: { delivered, failed, dead },
    };
  }
}