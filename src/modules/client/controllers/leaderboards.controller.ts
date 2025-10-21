import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiKeyAuthGuard } from '../../common/guards/apikey.guard';
import { PlayersService } from '../../players/players.service';

@ApiTags('Client - Leaderboards')
@ApiSecurity('Tenant')
@ApiSecurity('ApiKey')
@Controller('client/leaderboards')
export class ClientLeaderboardsController {
  constructor(private readonly players: PlayersService) {}

  @Get('project/:projectId/top/xp')
  @ApiOperation({ summary: 'Top players by XP (requires x-api-key)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max entries (default 20, max 100)' })
  @UseGuards(ApiKeyAuthGuard)
  async topXp(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('limit') limitRaw?: string,
  ) {
    const tenantId = (req as any).tenantId as string;
    const limit = Math.min(Math.max(parseInt(limitRaw || '20', 10) || 20, 1), 100);
    const all = await this.players.findAll(tenantId, projectId);
    const sorted = all.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)).slice(0, limit);
    return {
      projectId,
      leaderboard: 'xp_alltime',
      items: sorted.map((p, i) => ({ rank: i + 1, id: p.id, username: p.username, xp: p.xp, level: p.level })),
    };
  }

  @Get('project/:projectId/player/:playerId/xp/rank')
  @ApiOperation({ summary: 'Get player XP rank within project' })
  @UseGuards(ApiKeyAuthGuard)
  async xpRank(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('playerId') playerId: string,
  ) {
    const tenantId = (req as any).tenantId as string;
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