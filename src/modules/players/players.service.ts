import { BadRequestException, ConflictException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Player, PlayerDocument } from './schemas/player.schema';
import { CreatePlayerDto } from './dto/create-player.dto';
import { EventsService } from '../events/events.service';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import * as moment from 'moment';

@Injectable()
export class PlayersService {
    constructor(
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @Inject(forwardRef(() => EventsService)) private readonly events: EventsService,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    ) {}

    private async ensureProject(tenantId: string, projectId: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId');
        if (!projectId) throw new BadRequestException('projectId is required');
        if (!Types.ObjectId.isValid(projectId)) throw new BadRequestException('Invalid projectId');
        const exists = await this.projectModel.exists({ _id: projectId, tenantId });
        if (!exists) throw new NotFoundException('Project not found for this tenant');
    }

    async create(tenantId: string, dto: CreatePlayerDto) {
        await this.ensureProject(tenantId, dto.projectId);

        try {
            const doc = new this.playerModel({
                tenantId,
                projectId: dto.projectId,
                username: dto.username,
                xp: 0,
                level: 1,
                wallet: { soft: 0, hard: 0 },
            });
            const saved = await doc.save();

            await this.events.log({
                tenantId,
                projectId: dto.projectId,
                type: 'player.created',
                playerId: saved._id.toString(),
                payload: { username: dto.username },
            });

            return {
                id: saved._id.toString(),
                username: saved.username,
                projectId: saved.projectId,
                xp: saved.xp,
                level: saved.level,
                wallet: saved.wallet,
                createdAt: saved.createdAt,
                updatedAt: saved.updatedAt,
            };
        } catch (err: any) {
            if (err?.code === 11000) throw new ConflictException('Username already exists in this project');
            throw err;
        }
    }

    async get(tenantId: string, id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid player id');
        }
        const _id = new Types.ObjectId(id);
        const player = await this.playerModel.findOne(
            { _id, tenantId },
            { username: 1, xp: 1, level: 1, wallet: 1, projectId: 1, createdAt: 1, updatedAt: 1 },
        ).lean();
        if (!player) throw new NotFoundException('Player not found');
        return {
            id,
            username: player.username,
            projectId: player.projectId,
            xp: player.xp,
            level: player.level,
            wallet: player.wallet,
            createdAt: player.createdAt,
            updatedAt: player.updatedAt,
        };
    }

    async getByUsername(tenantId: string, projectId: string, username: string) {
        await this.ensureProject(tenantId, projectId);
        const p = await this.playerModel.findOne(
            { tenantId, projectId, username },
            { username: 1, xp: 1, level: 1, wallet: 1, projectId: 1, createdAt: 1 },
        ).lean();
        if (!p) throw new NotFoundException('Player not found');
        return { id: (p as any)._id?.toString(), ...p };
    }
    
    async findAll(tenantId: string, projectId: string) {
        await this.ensureProject(tenantId, projectId);

        const players = await this.playerModel
            .find({ tenantId, projectId })
            .select('username xp level wallet')
            .lean()
            .exec();

        return players.map((p: any) => ({
            id: p._id.toString(),
            username: p.username,
            xp: p.xp,
            level: p.level,
            wallet: p.wallet,
        }));
    }
    
    async getActivePlayerMetrics(tenantId: string, projectId: string, startDate: Date, endDate: Date) {
        await this.ensureProject(tenantId, projectId);
        
        // Total players count
        const totalPlayers = await this.playerModel.countDocuments({
            tenantId,
            projectId,
        });
        
        // New players in period
        const newPlayers = await this.playerModel.countDocuments({
            tenantId,
            projectId,
            createdAt: { $gte: startDate, $lte: endDate }
        });
        
        // Daily new players
        const dailyNewPlayers = await this.playerModel.aggregate([
            {
                $match: {
                    tenantId,
                    projectId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    date: "$_id",
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { date: 1 }
            }
        ]).exec();
        
        return {
            totalPlayers,
            newPlayers,
            dailyNewPlayers
        };
    }
    
    async findOne(tenantId: string, projectId: string, playerId: string) {
        await this.ensureProject(tenantId, projectId);
        if (!Types.ObjectId.isValid(playerId)) {
            throw new BadRequestException('Invalid player id');
        }
        
        const player = await this.playerModel.findOne(
            { _id: playerId, tenantId, projectId },
            { username: 1, xp: 1, level: 1, wallet: 1, inventory: 1, projectId: 1, createdAt: 1, updatedAt: 1 },
        ).lean();
        
        if (!player) throw new NotFoundException('Player not found');
        
        return {
            id: playerId,
            username: player.username,
            projectId: player.projectId,
            xp: player.xp,
            level: player.level,
            wallet: player.wallet,
            inventory: player.inventory || {},
            createdAt: player.createdAt,
            updatedAt: player.updatedAt,
        };
    }
    
    async update(tenantId: string, projectId: string, playerId: string, updatePlayerDto: any) {
        await this.ensureProject(tenantId, projectId);
        if (!Types.ObjectId.isValid(playerId)) {
            throw new BadRequestException('Invalid player id');
        }
        
        const player = await this.playerModel.findOneAndUpdate(
            { _id: playerId, tenantId, projectId },
            { $set: updatePlayerDto },
            { new: true }
        );
        
        if (!player) throw new NotFoundException('Player not found');
        
        await this.events.log({
            tenantId,
            projectId,
            type: 'player.updated',
            playerId,
            payload: updatePlayerDto,
        });
        
        return {
            id: player._id.toString(),
            username: player.username,
            projectId: player.projectId,
            xp: player.xp,
            level: player.level,
            wallet: player.wallet,
            inventory: player.inventory || {},
            createdAt: player.createdAt,
            updatedAt: player.updatedAt,
        };
    }
}
