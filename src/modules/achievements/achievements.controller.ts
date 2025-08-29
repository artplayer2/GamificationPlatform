import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GrantAchievementDto } from './dto/grant-achievement.dto';

@ApiTags('Achievements')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (ex.: demo)',
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

    @Get()
    @ApiQuery({ name: 'projectId', required: true })
    list(@Req() req: Request, @Query('projectId') projectId: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.listDefs(tenantId, projectId);
    }

    @Get('player')
    @ApiQuery({ name: 'projectId', required: true })
    @ApiQuery({ name: 'playerId', required: true })
    player(@Req() req: Request, @Query('projectId') projectId: string, @Query('playerId') playerId: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.getPlayerAchievements(tenantId, projectId, playerId);
    }

    @Post('grant')
    grant(@Req() req: Request, @Body() body: GrantAchievementDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.grantDirect(tenantId, body.projectId, body.playerId, body.code);
    }
}
