import { Body, Controller, Post, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { AwardXpDto } from './dto/award-xp.dto';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
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
        private readonly achievements: AchievementsService,
    ) {}

    @Post('xp')
    async award(@Req() req: Request, @Body() body: AwardXpDto) {
        const tenantId = (req as any).tenantId as string;
        const player = await this.playerModel.findOne({ _id: body.playerId, tenantId });
        if (!player) throw new Error('Player not found');

        player.xp += body.amount;
        const newLevel = Math.floor(player.xp / 1000) + 1;
        player.level = newLevel;
        await player.save();

        const projectId = player.projectId;
        const unlockedCodes = await this.achievements.checkUnlocksOnXp(
            tenantId, projectId, player.id, player.xp
        );

        return {
            playerId: player.id,
            xp: player.xp,
            level: player.level,
            reason: body.reason,
            achievementsUnlocked: unlockedCodes, // lista de codes desbloqueados nesta operação
        };
    }
}
