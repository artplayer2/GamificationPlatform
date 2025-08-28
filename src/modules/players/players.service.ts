import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from './schemas/player.schema';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class PlayersService {
  constructor(@InjectModel(Player.name) private playerModel: Model<PlayerDocument>) {}

  async create(tenantId: string, dto: CreatePlayerDto) {
    const doc = new this.playerModel({
      tenantId,
      projectId: dto.projectId,
      username: dto.username,
    });
    return await doc.save();
  }

  async get(tenantId: string, id: string) {
    const player = await this.playerModel.findOne({ _id: id, tenantId });
    if (!player) throw new NotFoundException('Player not found');
    return player;
  }
}
