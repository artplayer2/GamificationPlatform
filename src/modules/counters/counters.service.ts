import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { IncrementCounterDto } from './dto/increment-counter.dto';
import { AchievementDef, AchievementDefDocument } from '../achievements/schemas/achievement-def.schema';
import { PlayerAchievement, PlayerAchievementDocument } from '../achievements/schemas/player-achievement.schema';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { EventsService } from '../events/events.service';

@Injectable()
export class CountersService {
    constructor(
        @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
        @InjectModel(AchievementDef.name) private defModel: Model<AchievementDefDocument>,
        @InjectModel(PlayerAchievement.name) private paModel: Model<PlayerAchievementDocument>,
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        private readonly events: EventsService,
    ) {}

    async increment(tenantId: string, dto: IncrementCounterDto) {
        const player = await this.playerModel.findOne({ _id: dto.playerId, tenantId, projectId: dto.projectId }).lean();
        if (!player) throw new NotFoundException('Player not found in this project');

        const anyDefForThisCounter = await this.defModel.exists({
            tenantId,
            projectId: dto.projectId,
            type: 'counter_threshold',
            counterName: dto.name,
        });
        if (!anyDefForThisCounter) {
            throw new BadRequestException('Unknown counter name for this project');
        }

        const updated = await this.counterModel.findOneAndUpdate(
            { tenantId, projectId: dto.projectId, playerId: dto.playerId, name: dto.name },
            { $inc: { value: dto.amount } },
            { new: true, upsert: true },
        );

        // 🎯 evento de incremento do counter
        await this.events.log({
            tenantId,
            projectId: dto.projectId,
            type: 'counter.incremented',
            playerId: dto.playerId,
            payload: { name: dto.name, amount: dto.amount, value: updated.value },
        });

        const candidates = await this.defModel.find({
            tenantId,
            projectId: dto.projectId,
            type: 'counter_threshold',
            counterName: dto.name,
            counterMin: { $lte: updated.value },
        }).lean();

        const unlocked: string[] = [];
        for (const d of candidates) {
            try {
                await this.paModel.create({
                    tenantId,
                    projectId: dto.projectId,
                    playerId: dto.playerId,
                    code: d.code,
                    unlockedAt: new Date(),
                });
                unlocked.push(d.code);

                await this.events.log({
                    tenantId,
                    projectId: dto.projectId,
                    type: 'achievement.unlocked',
                    playerId: dto.playerId,
                    payload: { code: d.code, via: 'counter_threshold', counterName: dto.name, value: updated.value },
                });
            } catch (err: any) {
                if (!(err?.code === 11000)) throw err;
            }
        }

        return {
            counter: { name: dto.name, value: updated.value },
            achievementsUnlocked: unlocked,
            _debug: {
                matchedDefinitions: candidates.map(c => ({ code: c.code, counterMin: c.counterMin })),
                matchedCount: candidates.length,
            },
        };
    }
}
