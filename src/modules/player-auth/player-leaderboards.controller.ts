import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PlayerAuthGuard } from '../common/guards/player.guard';
import { PlayersService } from '../players/players.service';

@ApiTags('Player')
@ApiBearerAuth()
@Controller('player/leaderboards')
export class PlayerLeaderboardsController {
  constructor(private readonly players: PlayersService) {}

  @Get('top/xp')
  @ApiOperation({ summary: 'Top players by XP (project from token)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max entries (default 20, max 100)' })
  @UseGuards(PlayerAuthGuard)
  async topXp(@Req() req: Request, @Query('limit') limitRaw?: string) {
    const tenantId = (req as any).tenantId as string;
    const projectId = (req as any).projectId as string;
    const limit = Math.min(Math.max(parseInt(limitRaw || '20', 10) || 20, 1), 100);
    const all = await this.players.findAll(tenantId, projectId);
    const sorted = all.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)).slice(0, limit);
    return {
      projectId,
      leaderboard: 'xp_alltime',
      items: sorted.map((p, i) => ({ rank: i + 1, id: p.id, username: p.username, xp: p.xp, level: p.level })),
    };
  }

  @Get('me/xp/rank')
  @ApiOperation({ summary: 'Get my XP rank within project' })
  @UseGuards(PlayerAuthGuard)
  async myXpRank(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    const projectId = (req as any).projectId as string;
    const playerId = (req as any).player?.id as string;
    const all = await this.players.findAll(tenantId, projectId);
    const sorted = all.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));
    const idx = sorted.findIndex(p => p.id === playerId);
    const rank = idx >= 0 ? idx + 1 : null;
    const player = sorted.find(p => p.id === playerId) || null;
    return {
      projectId,
      leaderboard: 'xp_alltime',
      rank,
      player,
      totalPlayers: sorted.length,
    };
  }
}