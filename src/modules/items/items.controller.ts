import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDefDto } from './dto/create-item-def.dto';
import { GrantItemDto } from './dto/grant-item.dto';
import { ConsumeItemDto } from './dto/consume-item.dto';

@ApiTags('Items')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (ex.: demo)',
    required: true,
})
@Controller('items')
export class ItemsController {
    constructor(private readonly svc: ItemsService) {}

    @Post()
    createDef(@Req() req: Request, @Body() body: CreateItemDefDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.createDef(tenantId, body);
    }

    @Get()
    @ApiQuery({ name: 'projectId', required: true })
    listDefs(@Req() req: Request, @Query('projectId') projectId: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.listDefs(tenantId, projectId);
    }

    @Post('grant')
    grant(@Req() req: Request, @Body() body: GrantItemDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.grant(tenantId, body);
    }

    @Post('consume')
    consume(@Req() req: Request, @Body() body: ConsumeItemDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.consume(tenantId, body);
    }

    @Get('player')
    @ApiQuery({ name: 'projectId', required: true })
    @ApiQuery({ name: 'playerId', required: true })
    listPlayer(@Req() req: Request, @Query('projectId') projectId: string, @Query('playerId') playerId: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.listPlayerItems(tenantId, projectId, playerId);
    }
}
