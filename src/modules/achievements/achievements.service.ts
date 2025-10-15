import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AchievementDef, AchievementDefDocument } from './schemas/achievement-def.schema';
import { PlayerAchievement, PlayerAchievementDocument } from './schemas/player-achievement.schema';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { EventsService } from '../events/events.service';

@Injectable()
export class AchievementsService {
    constructor(
        @InjectModel(AchievementDef.name) private defModel: Model<AchievementDefDocument>,
        @InjectModel(PlayerAchievement.name) private paModel: Model<PlayerAchievementDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        private readonly events: EventsService,
    ) {}
    
    async getPlayerAchievements(tenantId: string, projectId: string, playerId: string) {
        const achievements = await this.paModel.find({ tenantId, projectId, playerId }).lean();
        return achievements.map(a => ({
            id: a._id.toString(),
            code: a.code,
            unlockedAt: a.unlockedAt,
        }));
    }
    
    async unlockAchievement(tenantId: string, projectId: string, playerId: string, code: string) {
        // Verificar se a conquista existe
        const achievement = await this.defModel.findOne({ tenantId, projectId, code }).lean();
        if (!achievement) {
            throw new NotFoundException('Achievement not found');
        }
        
        try {
            const unlocked = await this.paModel.create({ 
                tenantId, 
                projectId, 
                playerId, 
                code, 
                unlockedAt: new Date() 
            });
            
            await this.events.log({
                tenantId,
                projectId,
                type: 'achievement.unlocked',
                playerId,
                payload: {
                    code,
                    achievementId: achievement._id.toString()
                },
            });
            
            return {
                id: unlocked._id.toString(),
                code: unlocked.code,
                unlockedAt: unlocked.unlockedAt
            };
        } catch (err: any) {
            if (err?.code === 11000) {
                // Conquista já desbloqueada
                const existing = await this.paModel.findOne({ tenantId, projectId, playerId, code }).lean();
                if (!existing) {
                    return {
                        code,
                        alreadyUnlocked: true,
                    } as any;
                }
                return {
                    id: existing._id.toString(),
                    code: existing.code,
                    unlockedAt: existing.unlockedAt,
                    alreadyUnlocked: true,
                };
            }
            throw err;
        }
    }
    
    async findAll(tenantId: string, projectId: string) {
        const achievements = await this.defModel.find({ tenantId, projectId }).lean();
        return achievements.map(a => ({
            id: a._id.toString(),
            code: a.code,
            title: a.title,
            description: a.description,
            imageUrl: a.imageUrl,
            type: a.type,
            minXp: a.minXp,
            counterName: a.counterName,
            counterMin: a.counterMin
        }));
    }

    /** Cria uma definição de achievement para um projeto */
    async createDef(tenantId: string, dto: CreateAchievementDto) {
        if (dto.type === 'xp_threshold' && (dto.minXp ?? undefined) === undefined) {
            throw new BadRequestException('minXp is required for xp_threshold');
        }
        if (dto.type === 'counter_threshold' && (!dto.counterName || !dto.counterMin)) {
            throw new BadRequestException('counterName and counterMin are required for counter_threshold');
        }

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

    /** Lista definições com paginação por cursor e filtro opcional por code */
    async listDefsPaged(tenantId: string, params: { projectId: string; code?: string; after?: string; limit?: number }) {
        const filter: any = { tenantId, projectId: params.projectId };
        if (params.code) filter.code = params.code;

        if (params.after) {
            filter._id = { $lt: new Types.ObjectId(params.after) };
        }

        const limit = params.limit ?? 20;

        const rows = await this.defModel
            .find(filter)
            .sort({ _id: -1 })
            .limit(limit)
            .lean();

        const nextCursor = rows.length === limit ? rows[rows.length - 1]._id.toString() : null;

        return {
            items: rows.map(r => ({
                id: r._id.toString(),
                code: r.code,
                title: r.title,
                description: r.description,
                imageUrl: r.imageUrl,
                type: r.type,
                minXp: r.minXp,
                counterName: r.counterName,
                counterMin: r.counterMin,
                projectId: r.projectId,
                createdAt: (r as any).createdAt,
            })),
            nextCursor,
        };
    }

    /** Desbloqueia conquistas por XP e loga eventos */
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

                // evento
                await this.events.log({
                    tenantId, projectId, type: 'achievement.unlocked', playerId,
                    payload: { code: c.code, via: 'xp_threshold' },
                });
            } catch (err: any) {
                if (!(err?.code === 11000)) throw err; // duplicado → ignora
            }
        }
        return unlocked;
    }

    /** Achievements do jogador (com metadados) */
    async getPlayerAchievementsDetailed(tenantId: string, projectId: string, playerId: string) {
        const unlocks = await this.paModel.find({ tenantId, projectId, playerId }).lean();
        if (!unlocks.length) return [];

        const codes = unlocks.map(u => u.code);
        const defs = await this.defModel.find({ tenantId, projectId, code: { $in: codes } }).lean();
        const defMap = new Map(defs.map(d => [d.code, d]));

        return unlocks.map(u => {
            const d = defMap.get(u.code);
            return {
                code: u.code,
                unlockedAt: (u as any).unlockedAt,
                title: d?.title ?? u.code,
                description: d?.description ?? null,
                imageUrl: d?.imageUrl ?? null,
                type: d?.type ?? null,
            };
        });
    }

    /** Grant manual: concede conquista diretamente (idempotente) + evento */
    async grantDirect(tenantId: string, projectId: string, playerId: string, code: string) {
        const def = await this.defModel.findOne({ tenantId, projectId, code }).lean();
        if (!def) throw new NotFoundException('Achievement definition not found');

        try {
            const pa = await this.paModel.create({ tenantId, projectId, playerId, code, unlockedAt: new Date() });

            await this.events.log({
                tenantId, projectId, type: 'achievement.unlocked', playerId,
                payload: { code, via: 'manual' },
            });

            return { granted: true, code: pa.code };
        } catch (err: any) {
            if (err?.code === 11000) {
                return { granted: false, alreadyUnlocked: true, code };
            }
            throw err;
        }
    }
}
