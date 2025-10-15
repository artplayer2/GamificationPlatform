import { Injectable, Optional, Inject, forwardRef, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { WebhooksService } from '../webhooks/webhooks.service';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { RealtimeService } from '../realtime/realtime.service';
import * as moment from 'moment';

@Injectable()
export class EventsService {
    constructor(
        @InjectModel(Event.name) private eventModel: Model<EventDocument>,
        @Optional() @Inject(forwardRef(() => WebhooksService)) private webhooks?: WebhooksService,
        @InjectModel(Project.name) private projectModel?: Model<ProjectDocument>,
        private readonly realtime?: RealtimeService,
    ) {}

    async create(tenantId: string, projectId: string, createEventDto: { type: string; playerId?: string; payload?: any }) {
        return this.log({
            tenantId,
            projectId,
            type: createEventDto.type,
            playerId: createEventDto.playerId,
            payload: createEventDto.payload
        });
    }
    
    async getProjectEventMetrics(tenantId: string, projectId: string, startDate: Date, endDate: Date) {
        await this.ensureProject(tenantId, projectId);
        
        const eventCounts = await this.eventModel.aggregate([
            {
                $match: {
                    tenantId,
                    projectId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    type: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]).exec();
        
        const dailyEvents = await this.eventModel.aggregate([
            {
                $match: {
                    tenantId,
                    projectId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        type: "$type"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    date: "$_id.date",
                    type: "$_id.type",
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { date: 1 }
            }
        ]).exec();
        
        return {
            totalEvents: await this.eventModel.countDocuments({
                tenantId,
                projectId,
                createdAt: { $gte: startDate, $lte: endDate }
            }),
            eventsByType: eventCounts,
            dailyEvents
        };
    }

    private async ensureProject(tenantId: string, projectId: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId');
        if (!projectId) throw new BadRequestException('Missing projectId');
        if (!Types.ObjectId.isValid(projectId)) throw new BadRequestException('Invalid projectId');
        const exists = await this.projectModel!.exists({ _id: projectId, tenantId });
        if (!exists) throw new NotFoundException('Project not found for this tenant');
    }

    async log(params: {
        tenantId: string;
        projectId: string;
        type: string;
        playerId?: string;
        payload?: any;
    }) {
        await this.ensureProject(params.tenantId, params.projectId);

        const event = await this.eventModel.create({
            tenantId: params.tenantId,
            projectId: params.projectId,
            type: params.type,
            playerId: params.playerId,
            payload: params.payload ?? null,
        });

        // 🔊 Realtime: publica para clientes WS do mesmo projectId
        if (this.realtime) {
            this.realtime.publishEvent({
                tenantId: params.tenantId,
                projectId: params.projectId,
                type: params.type,
                payload: {
                    playerId: params.playerId ?? null,
                    ...((params.payload && typeof params.payload === 'object')
                        ? params.payload
                        : { value: params.payload }),
                },
                id: event._id.toString(),
                createdAt: event.createdAt?.toISOString?.(),
            });
        }

        // 📦 Webhooks outbox
        if (this.webhooks) {
            await this.webhooks.enqueueForEvent({
                tenantId: params.tenantId,
                projectId: params.projectId,
                eventId: event._id.toString(),
                eventType: params.type,
                payload: {
                    playerId: params.playerId ?? null,
                    ...((params.payload && typeof params.payload === 'object')
                        ? params.payload
                        : { value: params.payload }),
                },
            });
        }

        return { id: event._id.toString(), createdAt: event.createdAt, ...params };
    }
}
