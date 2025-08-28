import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { IncrementCounterDto } from './dto/increment-counter.dto';
import { AchievementDef, AchievementDefDocument } from '../achievements/schemas/achievement-def.schema';
import { PlayerAchievement, PlayerAchievementDocument } from '../achievements/schemas/player-achievement.schema';

@Injectable()
export class CountersService {
    constructor(
        @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
        @InjectModel(AchievementDef.name) private defModel: Model<AchievementDefDocument>,
        @InjectModel(PlayerAchievement.name) private paModel: Model<PlayerAchievementDocument>,
    ) {}

    async increment(tenantId: string, dto: IncrementCounterDto) {
        // incrementa/insere contador
        const updated = await this.counterModel.findOneAndUpdate(
            { tenantId, projectId: dto.projectId, playerId: dto.playerId, name: dto.name },
            { $inc: { value: dto.amount } },
            { new: true, upsert: true },
        );

        // checa conquistas counter_threshold relacionadas a este nome
        const defs = await this.defModel.find({
            tenantId,
            projectId: dto.projectId,
            type: 'counter_threshold',
            counterName: dto.name,
            counterMin: { $lte: updated.value },
        }).lean();

        const unlocked: string[] = [];
        for (const d of defs) {
            try {
                await this.paModel.create({
                    tenantId,
                    projectId: dto.projectId,
                    playerId: dto.playerId,
                    code: d.code,
                    unlockedAt: new Date(),
                });
                unlocked.push(d.code);
            } catch (err: any) {
                if (!(err?.code === 11000)) throw err; // já desbloqueado → ignora
            }
        }

        return { name: dto.name, value: updated.value, achievementsUnlocked: unlocked };
    }
}
