import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AchievementDef, AchievementDefDocument } from './schemas/achievement-def.schema';
import { PlayerAchievement, PlayerAchievementDocument } from './schemas/player-achievement.schema';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema'

@Injectable()
export class AchievementsService {
    constructor(
        @InjectModel(AchievementDef.name) private defModel: Model<AchievementDefDocument>,
        @InjectModel(PlayerAchievement.name) private paModel: Model<PlayerAchievementDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    ) {}

    async createDef(tenantId: string, dto: CreateAchievementDto) {
        // 1) validar projeto
        const project = await this.projectModel.findOne({ _id: dto.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');

        // 2) criar definição + capturar duplicado
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

    /**
     * Checa e desbloqueia conquistas (MVP: xp_threshold) quando o XP muda.
     * Retorna as conquistas desbloqueadas nesta chamada.
     */
    async checkUnlocksOnXp(tenantId: string, projectId: string, playerId: string, newXp: number) {
        const candidates = await this.defModel.find({
            tenantId, projectId, type: 'xp_threshold', minXp: { $lte: newXp },
        }).lean();

        if (!candidates.length) return [];

        const unlocked: string[] = [];
        for (const c of candidates) {
            try {
                await this.paModel.create({
                    tenantId, projectId, playerId, code: c.code, unlockedAt: new Date(),
                });
                unlocked.push(c.code);
            } catch (err: any) {
                // índice único evita duplicação; ignore erro de duplicado (E11000)
                if (!(err?.code === 11000)) throw err;
            }
        }
        return unlocked;
    }

    getPlayerAchievements(tenantId: string, projectId: string, playerId: string) {
        return this.paModel.find({ tenantId, projectId, playerId }).lean();
    }

    async grantDirect(tenantId: string, projectId: string, playerId: string, code: string) {
        // valida se a definição existe
        const def = await this.defModel.findOne({ tenantId, projectId, code }).lean();
        if (!def) throw new NotFoundException('Achievement definition not found');

        try {
            const pa = await this.paModel.create({ tenantId, projectId, playerId, code, unlockedAt: new Date() });
            return { granted: true, code: pa.code };
        } catch (err: any) {
            if (err?.code === 11000) {
                // já desbloqueado: idempotente
                return { granted: false, alreadyUnlocked: true, code };
            }
            throw err;
        }
    }
}
