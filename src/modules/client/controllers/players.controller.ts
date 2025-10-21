import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiKeyAuthGuard } from '../../common/guards/apikey.guard';
import { PlayersService } from '../../players/players.service';
import { AchievementsService } from '../../achievements/achievements.service';

@ApiTags('Client - Players')
@ApiSecurity('Tenant')
@ApiSecurity('ApiKey')
@Controller('client/players')
export class ClientPlayersController {
  constructor(
    private readonly players: PlayersService,
    private readonly achievements: AchievementsService,
  ) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'List players for a project (requires x-api-key)' })
  @UseGuards(ApiKeyAuthGuard)
  async list(@Req() req: Request, @Param('projectId') projectId: string) {
    const tenantId = (req as any).tenantId as string;
    return this.players.findAll(tenantId, projectId);
  }

  @Get('project/:projectId/username/:username')
  @ApiOperation({ summary: 'Get player by username (requires x-api-key)' })
  @UseGuards(ApiKeyAuthGuard)
  async byUsername(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('username') username: string,
  ) {
    const tenantId = (req as any).tenantId as string;
    return this.players.getByUsername(tenantId, projectId, username);
  }

  @Get('project/:projectId/:playerId')
  @ApiOperation({ summary: 'Get player details by id (requires x-api-key)' })
  @UseGuards(ApiKeyAuthGuard)
  async byId(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('playerId') playerId: string,
  ) {
    const tenantId = (req as any).tenantId as string;
    return this.players.findOne(tenantId, projectId, playerId);
  }

  @Get('project/:projectId/:playerId/achievements')
  @ApiOperation({ summary: 'List player achievements (requires x-api-key)' })
  @UseGuards(ApiKeyAuthGuard)
  async achievementsOf(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('playerId') playerId: string,
  ) {
    const tenantId = (req as any).tenantId as string;
    return this.achievements.getPlayerAchievementsDetailed(tenantId, projectId, playerId);
  }
}