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
                metadata: dto.metadata ?? {},
            });
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ConflictException('Quest code already exists for this project');
            }
            throw err;
        }
    }

    async listDefsPaged(
        tenantId: string,
        params: { projectId: string; after?: string; limit?: number; code?: string },
    ) {
        const filter: any = { tenantId, projectId: params.projectId };
        if (params.code) filter.code = params.code;

        // 👇 validação robusta do cursor
        if (params.after !== undefined && params.after !== null && params.after !== '') {
            if (!Types.ObjectId.isValid(params.after)) {
                throw new BadRequestException('Invalid after cursor');
            }
            filter._id = { $lt: new Types.ObjectId(params.after) };
        }

        const limit = Number.isFinite(params.limit as number) ? (params.limit as number) : 20;

        const rows = await this.defModel
            .find(filter)
            .sort({ _id: -1 })
            .limit(limit)
            .lean();

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

        const player = await this.playerModel.findOne({ _id: playerId, tenantId, projectId: body.projectId });
        if (!player) throw new NotFoundException('Player not found in this project');

        // 1) idempotência da operação de completar
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
            // já existe transação com essa chave → resposta do estado atual
            const pq = await this.pqModel.findOne({ tenantId, projectId: body.projectId, playerId, code }).lean();
            const already = !!pq;
            const result = {
                playerId,
                projectId: body.projectId,
                code,
                alreadyCompleted: already,
                idempotent: true,
            };
            return result;
        }

        // 2) verifica se já está concluída (idempotência por recurso)
        const existing = await this.pqModel.findOne({ tenantId, projectId: body.projectId, playerId, code }).lean();
        if (existing) {
            // registra snapshot na tx e retorna
            await this.txModel.updateOne(
                { tenantId, idempotencyKey: body.idempotencyKey },
                { $set: { resultSnapshot: { playerId, projectId: body.projectId, code, alreadyCompleted: true, idempotent: !isNewTx } } },
            );
            return { playerId, projectId: body.projectId, code, alreadyCompleted: true, idempotent: !isNewTx };
        }

        // 3) busca definição
        const def = await this.defModel.findOne({ tenantId, projectId: body.projectId, code }).lean();
        if (!def) throw new NotFoundException('Quest definition not found');

        // 4) aplica recompensas (XP e moedas) – idempotente pois só executa no "primeiro complete"
        let xpAwarded = 0;
        let walletSoft = 0;
        let walletHard = 0;

        if ((def.rewardXp ?? 0) > 0) xpAwarded = def.rewardXp!;
        if ((def.rewardSoft ?? 0) > 0) walletSoft = def.rewardSoft!;
        if ((def.rewardHard ?? 0) > 0) walletHard = def.rewardHard!;

        // 4.1) aplica XP: soma e recalcula level de acordo com a curva ativa (fallback linear 1000)
        if (xpAwarded > 0) {
            player.xp += xpAwarded;
            const { level } = await this.computeLevel(tenantId, body.projectId, player.xp);
            player.level = level;
        }

        // 4.2) aplica wallet (soft/hard)
        if (walletSoft > 0) player.wallet.soft += walletSoft;
        if (walletHard > 0) player.wallet.hard += walletHard;

        await player.save();

        // 5) grava registro de conclusão
        await this.pqModel.create({
            tenantId,
            projectId: body.projectId,
            playerId,
            code,
            status: 'completed',
            completedAt: new Date(),
            context: body.context ?? {},
        });

        // 6) checa achievements por XP, se houve XP
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
        await this.events.log({
            tenantId,
            projectId: body.projectId,
            type: 'quest.completed',
            playerId,
            payload: {
                code,
                rewards: { xp: xpAwarded, soft: walletSoft, hard: walletHard },
                context: body.context ?? {},
                achievementsUnlocked,
            },
        });

        const response = {
            playerId,
            projectId: body.projectId,
            code,
            rewards: { xp: xpAwarded, soft: walletSoft, hard: walletHard },
            achievementsUnlocked,
            idempotent: false,
        };

        // 8) snapshot para idempotência forte
        await this.txModel.updateOne(
            { tenantId, idempotencyKey: body.idempotencyKey },
            { $set: { resultSnapshot: response } },
        );

        return response;
    }

    // util: calcula level com base na curva ativa (ou fallback linear x1000)
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
