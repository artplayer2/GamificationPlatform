import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlayerAuthGuard } from '../common/guards/player.guard';
import { PlayersService } from '../players/players.service';
import { AchievementsService } from '../achievements/achievements.service';

@ApiTags('Player')
@ApiBearerAuth()
@Controller('player')
export class PlayerSelfController {
  constructor(
    private readonly players: PlayersService,
    private readonly achievements: AchievementsService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current player profile (xp, level, wallet, inventory)' })
  @UseGuards(PlayerAuthGuard)
  async me(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    const projectId = (req as any).projectId as string;
    const playerId = (req as any).player?.id as string;
    return this.players.findOne(tenantId, projectId, playerId);
  }

  @Get('me/achievements')
  @ApiOperation({ summary: 'List current player achievements' })
  @UseGuards(PlayerAuthGuard)
  async myAchievements(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    const projectId = (req as any).projectId as string;
    const playerId = (req as any).player?.id as string;
    return this.achievements.getPlayerAchievements(tenantId, projectId, playerId);
  }
}