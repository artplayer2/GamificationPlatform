import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import * as crypto from 'crypto';
import { WebhookSubscription, WebhookSubscriptionDocument } from './schemas/webhook-subscription.schema';
import { WebhookDelivery, WebhookDeliveryDocument } from './schemas/webhook-delivery.schema';
import { ListDeliveriesDto } from './dto/list-deliveries.dto';
import { RedriveDeliveriesDto } from './dto/redrive-deliveries.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

const BACKOFF_SECONDS = [10, 30, 120, 600, 3600, 21600];

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(
        @InjectModel(WebhookSubscription.name) private subsModel: Model<WebhookSubscriptionDocument>,
        @InjectModel(WebhookDelivery.name) private deliveriesModel: Model<WebhookDeliveryDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    ) {}

    private async ensureProject(tenantId: string, projectId: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        if (!projectId) throw new BadRequestException('projectId is required');
        if (!Types.ObjectId.isValid(projectId)) throw new BadRequestException('Invalid projectId');
        const exists = await this.projectModel.exists({ _id: projectId, tenantId });
        if (!exists) throw new NotFoundException('Project not found for this tenant');
    }

    // ---------- CRUD subscriptions ----------
    async createSubscription(tenantId: string, dto: {
        projectId: string; url: string; secret: string; eventTypes: string[]; active?: boolean;
    }) {
        await this.ensureProject(tenantId, dto.projectId);
        if (!dto.url) throw new BadRequestException('url is required');
        if (!dto.secret || dto.secret.length < 16) throw new BadRequestException('secret must be at least 16 chars');
        if (!Array.isArray(dto.eventTypes) || dto.eventTypes.length === 0) {
            throw new BadRequestException('eventTypes must be a non-empty array');
        }

        return this.subsModel.create({
            tenantId,
            projectId: dto.projectId,
            url: dto.url,
            secret: dto.secret,
            eventTypes: dto.eventTypes,
            active: dto.active ?? true,
        });
    }

    async getSubscription(tenantId: string, id: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        return this.subsModel.findOne({ _id: id, tenantId }).lean().exec();
    }

    async listSubscriptions(tenantId: string, projectId?: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        if (projectId) await this.ensureProject(tenantId, projectId);
        const q: any = { tenantId };
        if (projectId) q.projectId = projectId;
        return this.subsModel.find(q).lean().exec();
    }

    async updateSubscription(tenantId: string, id: string, patch: Partial<WebhookSubscription>) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        if (patch.projectId) await this.ensureProject(tenantId, String(patch.projectId));
        return this.subsModel.findOneAndUpdate({ _id: id, tenantId }, { $set: patch }, { new: true }).lean().exec();
    }

    async deleteSubscription(tenantId: string, id: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        return this.subsModel.deleteOne({ _id: id, tenantId }).exec();
    }

    async setSubscriptionActive(tenantId: string, id: string, active: boolean) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        return this.subsModel.findOneAndUpdate(
            { _id: id, tenantId },
            { $set: { active } },
            { new: true }
        ).lean().exec();
    }

    // ---------- Enfileirar ao criar Event ----------
    async enqueueForEvent(params: {
        tenantId: string; projectId: string; eventId: string; eventType: string; payload?: any;
    }) {
        const { tenantId, projectId, eventId, eventType, payload } = params;

        const subs = await this.subsModel.find({
            tenantId, projectId, active: true,
            eventTypes: { $in: ['*', eventType] },
        }).lean().exec();

        if (!subs.length) return 0;

        const docs = subs.map(s => ({
            tenantId,
            projectId,
            subscriptionId: s._id.toString(),
            eventId,
            eventType,
            payload,
            status: 'pending' as const,
            attempts: 0,
            maxAttempts: 6,
            nextAttemptAt: new Date(),
        }));

        const bulk = this.deliveriesModel.collection.initializeUnorderedBulkOp();
        docs.forEach(d => bulk.find({ subscriptionId: d.subscriptionId, eventId: d.eventId }).upsert().replaceOne(d));
        await bulk.execute();
        return docs.length;
    }

    // ---------- Worker ----------
    async pollAndDeliverBatch(limit = 20) {
        const now = new Date();
        const pendentes = await this.deliveriesModel.find({
            status: 'pending',
            nextAttemptAt: { $lte: now },
        }).limit(limit).lean().exec();

        for (const d of pendentes) {
            await this.attemptDelivery(d._id.toString());
        }
    }

    async attemptDelivery(deliveryId: string) {
        const d = await this.deliveriesModel.findById(deliveryId);
        if (!d || d.status !== 'pending') return;

        const sub = await this.subsModel.findById(d.subscriptionId).lean().exec();
        if (!sub || !sub.active) {
            d.status = 'dead';
            d.lastError = 'Subscription inactive or missing';
            await d.save();
            return;
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const bodyObj = {
            id: d._id.toString(),
            eventId: d.eventId,
            type: d.eventType,
            tenantId: d.tenantId,
            projectId: d.projectId,
            payload: d.payload ?? null,
            createdAt: new Date().toISOString(),
        };
        const body = JSON.stringify(bodyObj);

        const sig = crypto
            .createHmac('sha256', sub.secret)
            .update(`${timestamp}.${body}`)
            .digest('hex');

        try {
            const timeout = Number(process.env.WEBHOOK_TIMEOUT_MS || 5000);
            const resp = await axios.post(sub.url, body, {
                timeout,
                headers: {
                    'content-type': 'application/json',
                    'x-tenant-id': d.tenantId,
                    'x-project-id': d.projectId,
                    'x-event-type': d.eventType,
                    'x-webhook-timestamp': String(timestamp),
                    'x-webhook-signature': `t=${timestamp},v1=${sig}`,
                },
                validateStatus: () => true,
            });

            d.attempts += 1;
            d.responseStatus = resp.status;
            d.responseBody = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);

            if (resp.status >= 200 && resp.status < 300) {
                d.status = 'delivered';
            } else {
                this.scheduleRetry(d, `HTTP ${resp.status}`);
            }
        } catch (err: any) {
            d.attempts += 1;
            this.scheduleRetry(d, err?.message || 'Network/timeout');
        }

        await d.save();
    }

    private scheduleRetry(d: WebhookDeliveryDocument, reason: string) {
        d.lastError = reason;
        if (d.attempts >= d.maxAttempts) {
            d.status = 'dead';
            return;
        }
        const idx = Math.min(d.attempts - 1, BACKOFF_SECONDS.length - 1);
        const delay = BACKOFF_SECONDS[idx] || BACKOFF_SECONDS[BACKOFF_SECONDS.length - 1];
        d.nextAttemptAt = new Date(Date.now() + delay * 1000);
        d.status = 'pending';
    }

    static verifySignature(rawBody: string, header: string, secret: string): boolean {
        const m = /t=(\d+),v1=([a-f0-9]+)/i.exec(header || '');
        if (!m) return false;
        const [_, t, v1] = m;
        const check = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(v1, 'hex'));
    }

    // ---------- Listagem / consulta ----------
    async listDeliveries(tenantId: string, q: ListDeliveriesDto) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        if (q.projectId) await this.ensureProject(tenantId, q.projectId);

        const filter: any = { tenantId };
        if (q.projectId)       filter.projectId = q.projectId;
        if (q.subscriptionId)  filter.subscriptionId = q.subscriptionId;
        if (q.eventType)       filter.eventType = q.eventType;
        if (q.status)          filter.status = q.status;
        if (q.after)           filter.createdAt = { ...(filter.createdAt || {}), $gte: new Date(q.after) };
        if (q.before)          filter.createdAt = { ...(filter.createdAt || {}), $lte: new Date(q.before) };

        const limit = Math.min(q.limit ?? 50, 200);
        const cursorFilter = q.cursor ? { _id: { $lt: new Types.ObjectId(q.cursor) } } : {};

        const list = await this.deliveriesModel
            .find({ ...filter, ...cursorFilter })
            .sort({ _id: -1 })
            .limit(limit)
            .lean()
            .exec();

        const nextCursor = list.length ? list[list.length - 1]._id.toString() : null;
        return { results: list.map(d => ({ id: d._id.toString(), ...d })), nextCursor };
    }

    async getDelivery(tenantId: string, id: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        return this.deliveriesModel.findOne({ _id: id, tenantId }).lean().exec();
    }

    // ---------- Redrive ----------
    async redriveDeliveries(tenantId: string, dto: RedriveDeliveriesDto) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');

        const now = new Date();
        if (dto.ids?.length) {
            const ids = dto.ids.filter(Types.ObjectId.isValid).map(id => new Types.ObjectId(id));
            const filter: any = { tenantId, _id: { $in: ids } };
            if (dto.onlyFailedOrDead !== false) {
                filter.status = { $in: ['pending', 'dead'] };
            }
            const update: any = { $set: { nextAttemptAt: now, status: 'pending' } };
            if (dto.resetAttempts) update.$set.attempts = 0;

            const res = await this.deliveriesModel.updateMany(filter, update).exec();
            return { matched: (res as any).matchedCount ?? res.modifiedCount, modified: res.modifiedCount };
        }

        if (dto.projectId) await this.ensureProject(tenantId, dto.projectId);

        const filter: any = { tenantId };
        if (dto.projectId)      filter.projectId = dto.projectId;
        if (dto.subscriptionId) filter.subscriptionId = dto.subscriptionId;
        if (dto.eventType)      filter.eventType = dto.eventType;
        if (dto.status)         filter.status = dto.status;
        if (dto.after)          filter.createdAt = { ...(filter.createdAt || {}), $gte: new Date(dto.after) };
        if (dto.before)         filter.createdAt = { ...(filter.createdAt || {}), $lte: new Date(dto.before) };
        if (dto.onlyFailedOrDead !== false) {
            filter.status = filter.status ?? { $in: ['pending', 'dead'] };
        }

        const limit = Math.min(dto.limit ?? 200, 1000);
        const ids = await this.deliveriesModel.find(filter, { _id: 1 }).limit(limit).lean().exec();
        const update: any = { $set: { nextAttemptAt: now, status: 'pending' } };
        if (dto.resetAttempts) update.$set.attempts = 0;

        const res = await this.deliveriesModel.updateMany(
            { _id: { $in: ids.map(d => d._id) } },
            update
        ).exec();

        return { matched: ids.length, modified: res.modifiedCount };
    }
}
