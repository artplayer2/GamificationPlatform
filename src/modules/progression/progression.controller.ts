import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { AwardXpDto } from './dto/award-xp.dto';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { XpTx, XpTxDocument } from './schemas/xp-tx.schema';
import { ProgressionCurve, ProgressionCurveDocument } from './schemas/curve.schema';
import { AchievementsService } from '../achievements/achievements.service';

@ApiTags('Progression')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (ex.: demo)',
    required: true,
})
@Controller('progression')
export class ProgressionController {
    constructor(
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @InjectModel(XpTx.name) private xpTxModel: Model<XpTxDocument>,
        @InjectModel(ProgressionCurve.name) private curveModel: Model<ProgressionCurveDocument>,
        private readonly achievements: AchievementsService,
    ) {}

    @Post('xp')
    async award(@Req() req: Request, @Body() body: AwardXpDto) {
        const tenantId = (req as any).tenantId as string;

        // 0) idempotência: tenta registrar a transação
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
                // transação já processada → retorna o snapshot salvo
                const existing = await this.xpTxModel.findOne({ tenantId, idempotencyKey: body.idempotencyKey }).lean();
                if (existing?.resultSnapshot) return existing.resultSnapshot;
                // fallback: retorna estado atual do player
                const now = await this.playerModel.findOne({ _id: body.playerId, tenantId });
                if (!now) throw new Error('Player not found');
                const { level, nextLevelXp, curveId } = await this.computeLevelAndNext(tenantId, now.projectId, now.xp);
                return {
                    playerId: now.id,
                    xp: now.xp,
                    level,
                    nextLevelXp,
                    reason: body.reason,
                    achievementsUnlocked: [],
                    idempotent: true,
                    curveId,
                };
            }
            throw err;
        }

        // 1) aplica XP
        const player = await this.playerModel.findOne({ _id: body.playerId, tenantId });
        if (!player) throw new Error('Player not found');

        player.xp += body.amount;

        // 2) calcula level conforme a curva (ou fallback linear 1000)
        const { level, nextLevelXp, curveId } = await this.computeLevelAndNext(tenantId, player.projectId, player.xp);
        player.level = level;
        await player.save();

        // 3) checa achievements por XP
        const unlockedCodes = await this.achievements.checkUnlocksOnXp(
            tenantId, player.projectId, player.id, player.xp,
        );

        const payload = {
            playerId: player.id,
            xp: player.xp,
            level: player.level,
            nextLevelXp,
            reason: body.reason,
            achievementsUnlocked: unlockedCodes,
            idempotent: false,
            curveId,
        };

        // 4) salva snapshot no tx para idempotência forte
        await this.xpTxModel.updateOne(
            { tenantId, idempotencyKey: body.idempotencyKey },
            { $set: { resultSnapshot: payload } },
        );

        return payload;
    }

    @Get('players/:id/progression')
    async getProgression(@Req() req: Request, @Param('id') playerId: string) {
        const tenantId = (req as any).tenantId as string;
        const player = await this.playerModel.findOne({ _id: playerId, tenantId });
        if (!player) throw new Error('Player not found');

        const { level, nextLevelXp, curveId } = await this.computeLevelAndNext(tenantId, player.projectId, player.xp);

        return {
            playerId: player.id,
            xp: player.xp,
            level,
            nextLevelXp,
            curveId,
        };
    }

    // util: calcula level e próximo threshold dado o XP total e a curva ativa
    private async computeLevelAndNext(tenantId: string, projectId: string, totalXp: number) {
        const activeCurve = await this.curveModel.findOne({ tenantId, projectId, isActive: true }).lean();

        if (!activeCurve) {
            // fallback linear: 1 nível a cada 1000 XP
            const level = Math.floor(totalXp / 1000) + 1;
            const nextLevelXp = (Math.floor(totalXp / 1000) + 1) * 1000; // xp total para o próximo nível
            return { level, nextLevelXp, curveId: null as any };
        }

        const levels = activeCurve.levels; // xp total por nível
        let level = 1;
        for (let i = 0; i < levels.length; i++) {
            if (totalXp >= levels[i]) level = i + 1;
            else break;
        }

        // próximo threshold: o próximo valor em levels (se existir); se não, null
        const nextIdx = level; // pois level = i+1
        const nextLevelXp = levels[nextIdx] ?? null;

        return { level, nextLevelXp, curveId: activeCurve._id.toString() };
    }
}
