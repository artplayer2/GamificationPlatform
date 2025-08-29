import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './schemas/counter.schema';
import { IncrementCounterDto } from './dto/increment-counter.dto';
import { AchievementDef, AchievementDefDocument } from '../achievements/schemas/achievement-def.schema';
import { PlayerAchievement, PlayerAchievementDocument } from '../achievements/schemas/player-achievement.schema';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

@Injectable()
export class CountersService {
    constructor(
        @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
        @InjectModel(AchievementDef.name) private defModel: Model<AchievementDefDocument>,
        @InjectModel(PlayerAchievement.name) private paModel: Model<PlayerAchievementDocument>,
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    ) {}

    async increment(tenantId: string, dto: IncrementCounterDto) {
        // 1) valida projeto e player
        const project = await this.projectModel.findOne({ _id: dto.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');

        const player = await this.playerModel.findOne({ _id: dto.playerId, tenantId, projectId: dto.projectId }).lean();
        if (!player) throw new NotFoundException('Player not found in this project');

        // 2) valida se o counterName é conhecido neste projeto (há ao menos 1 definição usando-o)
        const anyDefForThisCounter = await this.defModel.exists({
            tenantId,
            projectId: dto.projectId,
            type: 'counter_threshold',
            counterName: dto.name,
        });
        if (!anyDefForThisCounter) {
            throw new BadRequestException('Unknown counter name for this project');
        }

        // 3) incrementa/upserta contador
        const updated = await this.counterModel.findOneAndUpdate(
            { tenantId, projectId: dto.projectId, playerId: dto.playerId, name: dto.name },
            { $inc: { value: dto.amount } },
            { new: true, upsert: true },
        );

        // 4) checa defs elegíveis (atingiram counterMin)
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
            } catch (err: any) {
                if (!(err?.code === 11000)) throw err; // já desbloqueado → ignora
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
