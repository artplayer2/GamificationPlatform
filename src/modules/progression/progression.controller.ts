import { Body, Controller, Get, Param, Post, Req, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { AwardXpDto } from './dto/award-xp.dto';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { XpTx, XpTxDocument } from './schemas/xp-tx.schema';
import { ProgressionCurve, ProgressionCurveDocument } from './schemas/curve.schema';
import { AchievementsService } from '../achievements/achievements.service';
import { EventsService } from '../events/events.service';

@ApiTags('Progression')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant ID (ex.: demo)', required: true })
@Controller('progression')
export class ProgressionController {
    constructor(
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @InjectModel(XpTx.name) private xpTxModel: Model<XpTxDocument>,
        @InjectModel(ProgressionCurve.name) private curveModel: Model<ProgressionCurveDocument>,
        private readonly achievements: AchievementsService,
        @Inject(forwardRef(() => EventsService)) private readonly events: EventsService,
    ) {}

    @Post('xp')
    async award(@Req() req: Request, @Body() body: AwardXpDto) {
        const tenantId = (req as any).tenantId as string;

        try {
            await this.xpTxModel.create({
                tenantId,
                playerId: body.playerId,
                amount: body.amount,
                reason: body.reason,
                idempotencyKey: body.idempotencyKey,
            });
        } catch (err: any) {
            if (err?.code === 11000) {
                const existing = await this.xpTxModel.findOne({ tenantId, idempotencyKey: body.idempotencyKey }).lean();
                if (existing?.resultSnapshot) return existing.resultSnapshot;
                const now = await this.playerModel.findOne({ _id: body.playerId, tenantId });
                if (!now) throw new Error('Player not found');
                const { level, nextLevelXp, curveId } = await this.computeLevelAndNext(tenantId, now.projectId, now.xp);
                return { playerId: now.id, xp: now.xp, level, nextLevelXp, reason: body.reason, achievementsUnlocked: [], idempotent: true, curveId };
            }
            throw err;
        }

        const before = await this.playerModel.findOne({ _id: body.playerId, tenantId });
        if (!before) throw new Error('Player not found');

        const prev = await this.computeLevelAndNext(tenantId, before.projectId, before.xp);
        const prevLevel = prev.level;

        const updated = await this.playerModel.findOneAndUpdate(
            { _id: body.playerId, tenantId },
            { $inc: { xp: body.amount } },
            { new: true },
        );
        if (!updated) throw new Error('Player not found (after update)');

        const { level, nextLevelXp, curveId } = await this.computeLevelAndNext(tenantId, updated.projectId, updated.xp);

        // ✅ chamada segura (não quebra o TS se o método não existir ainda)
        const achievementsUnlocked =
            typeof (this.achievements as any).checkAndUnlockByXp === 'function'
                ? await (this.achievements as any).checkAndUnlockByXp(tenantId, {
                    projectId: updated.projectId.toString(),
                    playerId: updated._id.toString(),
                    totalXp: updated.xp,
                })
                : [];

        await this.events.log({
            tenantId,
            projectId: updated.projectId.toString(),
            type: 'player.xp.added',
            playerId: updated._id.toString(),
            payload: { amount: body.amount, totalXp: updated.xp, reason: body.reason ?? null, idempotencyKey: body.idempotencyKey },
        });

        if (level !== prevLevel) {
            await this.events.log({
                tenantId,
                projectId: updated.projectId.toString(),
                type: 'player.level.updated',
                playerId: updated._id.toString(),
                payload: { previousLevel: prevLevel, newLevel: level, totalXp: updated.xp },
            });
        }

        await this.xpTxModel.updateOne(
            { tenantId, idempotencyKey: body.idempotencyKey },
            { $set: { resultSnapshot: {
                        playerId: updated.id, xp: updated.xp, level, nextLevelXp, reason: body.reason, achievementsUnlocked, idempotent: false, curveId,
                    } } },
        );

        return { playerId: updated.id, xp: updated.xp, level, nextLevelXp, curveId };
    }

    @Get('level/:projectId/:totalXp')
    async compute(@Req() req: Request, @Param('projectId') projectId: string, @Param('totalXp') totalXp: string) {
        const tenantId = (req as any).tenantId as string;
        const parsed = Number(totalXp);
        if (Number.isNaN(parsed) || parsed < 0) throw new Error('Invalid XP');
        const { level, nextLevelXp } = await this.computeLevelAndNext(tenantId, projectId, parsed);
        return { level, nextLevelXp };
    }

    private async computeLevelAndNext(tenantId: string, projectId: string, totalXp: number) {
        const activeCurve = await this.curveModel.findOne({ tenantId, projectId, isActive: true }).lean();
        if (!activeCurve) {
            const level = Math.floor(totalXp / 1000) + 1;
            const nextLevelXp = (Math.floor(totalXp / 1000) + 1) * 1000;
            return { level, nextLevelXp, curveId: null as any };
        }
        const levels = activeCurve.levels;
        let level = 1;
        for (let i = 0; i < levels.length; i++) {
            if (totalXp >= levels[i]) level = i + 1;
            else break;
        }
        const nextIdx = level;
        const nextLevelXp = levels[nextIdx] ?? null;
        return { level, nextLevelXp, curveId: activeCurve._id.toString() };
    }
}
