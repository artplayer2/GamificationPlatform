import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AchievementDef, AchievementDefDocument } from './schemas/achievement-def.schema';
import { PlayerAchievement, PlayerAchievementDocument } from './schemas/player-achievement.schema';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

@Injectable()
export class AchievementsService {
    constructor(
        @InjectModel(AchievementDef.name) private defModel: Model<AchievementDefDocument>,
        @InjectModel(PlayerAchievement.name) private paModel: Model<PlayerAchievementDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    ) {}

    /** Cria uma definição de achievement para um projeto */
    async createDef(tenantId: string, dto: CreateAchievementDto) {
        // valida coerência por tipo
        if (dto.type === 'xp_threshold' && (dto.minXp ?? undefined) === undefined) {
            throw new BadRequestException('minXp is required for xp_threshold');
        }
        if (dto.type === 'counter_threshold' && (!dto.counterName || !dto.counterMin)) {
            throw new BadRequestException('counterName and counterMin are required for counter_threshold');
        }

        // valida se o projeto existe neste tenant
        const project = await this.projectModel.findOne({ _id: dto.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');

        try {
            return await this.defModel.create({
                tenantId,
                projectId: dto.projectId,
                code: dto.code,
                title: dto.title,
                description: dto.description,
                imageUrl: dto.imageUrl,
                type: dto.type,
                minXp: dto.minXp,
                counterName: dto.counterName,
                counterMin: dto.counterMin,
            });
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ConflictException('Achievement code already exists for this project');
            }
            throw err;
        }
    }

    listDefs(tenantId: string, projectId: string) {
        return this.defModel.find({ tenantId, projectId }).lean();
    }

    /** Desbloqueia conquistas por XP */
    async checkUnlocksOnXp(tenantId: string, projectId: string, playerId: string, newXp: number) {
        const candidates = await this.defModel.find({
            tenantId, projectId, type: 'xp_threshold', minXp: { $lte: newXp },
        }).lean();

        if (!candidates.length) return [];

        const unlocked: string[] = [];
        for (const c of candidates) {
            try {
                await this.paModel.create({ tenantId, projectId, playerId, code: c.code, unlockedAt: new Date() });
                unlocked.push(c.code);
            } catch (err: any) {
                if (!(err?.code === 11000)) throw err; // duplicado → ignora
            }
        }
        return unlocked;
    }

    getPlayerAchievements(tenantId: string, projectId: string, playerId: string) {
        return this.paModel.find({ tenantId, projectId, playerId }).lean();
    }

    /** Grant manual: concede conquista diretamente (idempotente) */
    async grantDirect(tenantId: string, projectId: string, playerId: string, code: string) {
        const def = await this.defModel.findOne({ tenantId, projectId, code }).lean();
        if (!def) throw new NotFoundException('Achievement definition not found');

        try {
            const pa = await this.paModel.create({ tenantId, projectId, playerId, code, unlockedAt: new Date() });
            return { granted: true, code: pa.code };
        } catch (err: any) {
            if (err?.code === 11000) {
                return { granted: false, alreadyUnlocked: true, code };
            }
            throw err;
        }
    }
}
