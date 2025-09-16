import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuestDef, QuestDefDocument } from './schemas/quest-def.schema';
import { PlayerQuest, PlayerQuestDocument } from './schemas/player-quest.schema';
import { QuestTx, QuestTxDocument } from './schemas/quest-tx.schema';
import { CreateQuestDto } from './dto/create-quest.dto';
import { CompleteQuestDto } from './dto/complete-quest.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { ProgressionCurve, ProgressionCurveDocument } from '../progression/schemas/curve.schema';
import { AchievementsService } from '../achievements/achievements.service';
import { EventsService } from '../events/events.service';
import { ItemsService } from '../items/items.service';

@Injectable()
export class QuestsService {
    constructor(
        @InjectModel(QuestDef.name) private defModel: Model<QuestDefDocument>,
        @InjectModel(PlayerQuest.name) private pqModel: Model<PlayerQuestDocument>,
        @InjectModel(QuestTx.name) private txModel: Model<QuestTxDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @InjectModel(ProgressionCurve.name) private curveModel: Model<ProgressionCurveDocument>,
        private readonly achievements: AchievementsService,
        private readonly events: EventsService,
        private readonly items: ItemsService, // 👈 novo
    ) {}

    // ====== CRUD básico de definição ======
    async createDef(tenantId: string, dto: CreateQuestDto) {
        const project = await this.projectModel.findOne({ _id: dto.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');

        try {
            return await this.defModel.create({
                tenantId,
                projectId: dto.projectId,
                code: dto.code,
                title: dto.title,
                description: dto.description,
                rewardXp: dto.rewardXp ?? 0,
                rewardSoft: dto.rewardSoft ?? 0,
                rewardHard: dto.rewardHard ?? 0,
                rewardItems: (dto.rewardItems ?? []).map(i => ({ code: i.code, qty: i.qty })),
                metadata: dto.metadata ?? {},
            });
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ConflictException('Quest code already exists for this project');
            }
            throw err;
        }
    }

    async listDefsPaged(tenantId: string, params: { projectId: string; after?: string; limit?: number; code?: string }) {
        const filter: any = { tenantId, projectId: params.projectId };
        if (params.code) filter.code = params.code;
        if (params.after !== undefined && params.after !== null && params.after !== '') {
            if (!Types.ObjectId.isValid(params.after)) throw new BadRequestException('Invalid after cursor');
            filter._id = { $lt: new Types.ObjectId(params.after) };
        }
        const limit = Number.isFinite(params.limit as number) ? (params.limit as number) : 20;

        const rows = await this.defModel.find(filter).sort({ _id: -1 }).limit(limit).lean();
        const nextCursor = rows.length === limit ? rows[rows.length - 1]._id.toString() : null;

        return {
            items: rows.map(r => ({
                id: r._id.toString(),
                projectId: r.projectId,
                code: r.code,
                title: r.title,
                description: r.description,
                rewardXp: r.rewardXp,
                rewardSoft: r.rewardSoft,
                rewardHard: r.rewardHard,
                rewardItems: r.rewardItems ?? [],
                metadata: r.metadata ?? {},
                createdAt: (r as any).createdAt,
            })),
            nextCursor,
        };
    }

    // ====== Completar quest (idempotente) ======
    async complete(tenantId: string, playerId: string, code: string, body: CompleteQuestDto) {
        // 0) valida projeto e player
        const project = await this.projectModel.findOne({ _id: body.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');

        const player = await this.playerModel.findOne({ _id: playerId, tenantId });
        if (!player) throw new NotFoundException('Player not found');
        if (player.projectId !== body.projectId) {
            throw new BadRequestException(`Player belongs to a different project. expected=${body.projectId} actual=${player.projectId}`);
        }

        // 1) idempotência por operação
        let isNewTx = false;
        try {
            await this.txModel.create({
                tenantId,
                projectId: body.projectId,
                playerId,
                code,
                idempotencyKey: body.idempotencyKey,
            });
            isNewTx = true;
        } catch (err: any) {
            if (err?.code !== 11000) throw err;
            const pq = await this.pqModel.findOne({ tenantId, projectId: body.projectId, playerId, code }).lean();
            return {
                playerId,
                projectId: body.projectId,
                code,
                alreadyCompleted: !!pq,
                idempotent: true,
            };
        }

        // 2) se já concluída
        const existing = await this.pqModel.findOne({ tenantId, projectId: body.projectId, playerId, code }).lean();
        if (existing) {
            await this.txModel.updateOne(
                { tenantId, idempotencyKey: body.idempotencyKey },
                { $set: { resultSnapshot: { playerId, projectId: body.projectId, code, alreadyCompleted: true, idempotent: !isNewTx } } },
            );
            return { playerId, projectId: body.projectId, code, alreadyCompleted: true, idempotent: !isNewTx };
        }

        // 3) busca definição
        const def = await this.defModel.findOne({ tenantId, projectId: body.projectId, code }).lean();
        if (!def) throw new NotFoundException('Quest definition not found');

        // 4) aplica recompensas
        let xpAwarded = def.rewardXp ?? 0;
        let walletSoft = def.rewardSoft ?? 0;
        let walletHard = def.rewardHard ?? 0;

        if (xpAwarded > 0) {
            player.xp += xpAwarded;
            const { level } = await this.computeLevel(tenantId, body.projectId, player.xp);
            player.level = level;
        }
        if (walletSoft > 0) player.wallet.soft += walletSoft;
        if (walletHard > 0) player.wallet.hard += walletHard;

        await player.save();

        // 4.1) recompensa de ITENS (idempotente por item)
        const itemsGranted: Array<{ code: string; qty: number; idempotent: boolean }> = [];
        for (const it of def.rewardItems ?? []) {
            const itemKey = `${body.idempotencyKey}:item:${it.code}`;
            const result = await this.items.grant(tenantId, {
                projectId: body.projectId,
                playerId,
                code: it.code,
                qty: it.qty,
                idempotencyKey: itemKey,
                reason: `quest:${code}`,
            });
            itemsGranted.push({ code: it.code, qty: it.qty, idempotent: result.idempotent });
        }

        // 5) registra conclusão
        await this.pqModel.create({
            tenantId,
            projectId: body.projectId,
            playerId,
            code,
            status: 'completed',
            completedAt: new Date(),
            context: body.context ?? {},
        });

        // 6) checa achievements por XP
        let achievementsUnlocked: string[] = [];
        if (xpAwarded > 0) {
            achievementsUnlocked = await this.achievements.checkUnlocksOnXp(
                tenantId,
                body.projectId,
                playerId,
                player.xp,
            );
        }

        // 7) evento
        const response = {
            playerId,
            projectId: body.projectId,
            code,
            rewards: { xp: xpAwarded, soft: walletSoft, hard: walletHard, items: itemsGranted.map(i => ({ code: i.code, qty: i.qty })) },
            achievementsUnlocked,
            idempotent: false,
        };

        await this.events.log({
            tenantId,
            projectId: body.projectId,
            type: 'quest.completed',
            playerId,
            payload: {
                code,
                rewards: response.rewards,
                context: body.context ?? {},
                achievementsUnlocked,
            },
        });

        // 8) snapshot
        await this.txModel.updateOne(
            { tenantId, idempotencyKey: body.idempotencyKey },
            { $set: { resultSnapshot: response } },
        );

        return response;
    }

    // util: calcula level
    private async computeLevel(tenantId: string, projectId: string, totalXp: number) {
        const activeCurve = await this.curveModel.findOne({ tenantId, projectId, isActive: true }).lean();
        if (!activeCurve) {
            return { level: Math.floor(totalXp / 1000) + 1 };
        }
        const levels = activeCurve.levels;
        let level = 1;
        for (let i = 0; i < levels.length; i++) {
            if (totalXp >= levels[i]) level = i + 1;
            else break;
        }
        return { level };
    }
}
