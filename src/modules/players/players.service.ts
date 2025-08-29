import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from './schemas/player.schema';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class PlayersService {
    constructor(@InjectModel(Player.name) private playerModel: Model<PlayerDocument>) {}

    async create(tenantId: string, dto: CreatePlayerDto) {
        try {
            const doc = new this.playerModel({
                tenantId,
                projectId: dto.projectId,
                username: dto.username,
            });
            return await doc.save();
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ConflictException('Username already exists in this project');
            }
            throw err;
        }
    }

    async get(tenantId: string, id: string) {
        const player = await this.playerModel.findOne(
            { _id: id, tenantId },
            { username: 1, xp: 1, level: 1, wallet: 1, projectId: 1, createdAt: 1, updatedAt: 1 },
        ).lean();

        if (!player) throw new NotFoundException('Player not found');
        return {
            id: id,
            username: player.username,
            projectId: player.projectId,
            xp: player.xp,
            level: player.level,
            wallet: player.wallet,
            createdAt: player.createdAt,
            updatedAt: player.updatedAt,
        };
    }
}
