import { BadRequestException, Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GrantAchievementDto } from './dto/grant-achievement.dto';
import { AchievementsQueryDto } from './dto/achievements-query.dto';

@ApiTags('Achievements')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (e.g. demo)',
    required: true,
})
@Controller('achievements')
export class AchievementsController {
    constructor(private readonly svc: AchievementsService) {}

    @Post()
    create(@Req() req: Request, @Body() body: CreateAchievementDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.createDef(tenantId, body);
    }

    // Listagem paginada de definições
    @Get()
    async list(@Req() req: Request, @Query() query: AchievementsQueryDto) {
        const tenantId = (req as any).tenantId as string;
        if (!query.projectId) throw new BadRequestException('projectId is required');
        return this.svc.listDefsPaged(tenantId, query);
    }

    // Achievements do jogador (com metadados)
    @Get('player')
    @ApiQuery({ name: 'projectId', required: true })
    @ApiQuery({ name: 'playerId', required: true })
    async player(@Req() req: Request, @Query('projectId') projectId: string, @Query('playerId') playerId: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.getPlayerAchievementsDetailed(tenantId, projectId, playerId);
    }

    @Post('grant')
    grant(@Req() req: Request, @Body() body: GrantAchievementDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.grantDirect(tenantId, body.projectId, body.playerId, body.code);
    }
}
