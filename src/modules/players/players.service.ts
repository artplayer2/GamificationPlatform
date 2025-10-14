import { BadRequestException, ConflictException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Player, PlayerDocument } from './schemas/player.schema';
import { CreatePlayerDto } from './dto/create-player.dto';
import { EventsService } from '../events/events.service';

@Injectable()
export class PlayersService {
    constructor(
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @Inject(forwardRef(() => EventsService)) private readonly events: EventsService, // 👈
    ) {}

    async create(tenantId: string, dto: CreatePlayerDto) {
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

            // 🎯 Evento de domínio
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
        const p = await this.playerModel.findOne(
            { tenantId, projectId, username },
            { username: 1, xp: 1, level: 1, wallet: 1, projectId: 1, createdAt: 1 },
        ).lean();
        if (!p) throw new NotFoundException('Player not found');
        return { id: (p as any)._id?.toString(), ...p };
    }
}
