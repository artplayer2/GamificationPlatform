import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { QuestsService } from './quests.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { CompleteQuestDto } from './dto/complete-quest.dto';
import { QuestsQueryDto } from './dto/quests-query.dto';

@ApiTags('Quests')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (ex.: demo)',
    required: true,
})
@Controller('quests')
export class QuestsController {
    constructor(private readonly svc: QuestsService) {}

    @Post()
    create(@Req() req: Request, @Body() body: CreateQuestDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.createDef(tenantId, body);
    }

    @Get()
    list(@Req() req: Request, @Query() query: QuestsQueryDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.listDefsPaged(tenantId, {
            projectId: query.projectId,
            after: query.after?.trim() || undefined,
            limit: query.limit,
            code: query.code,
        });
    }

    @Post('/players/:playerId/:code/complete')
    complete(
        @Req() req: Request,
        @Param('playerId') playerId: string,
        @Param('code') code: string,
        @Body() body: CompleteQuestDto,
    ) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.complete(tenantId, playerId, code, body);
    }
}
