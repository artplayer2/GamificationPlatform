import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiHeader, ApiQuery, ApiTags, ApiBody } from '@nestjs/swagger';
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

    @ApiBody({ description: "Create/replace an item definition", examples: { default: { value: {
  "projectId": "66d2a1f5e4aabbccddeeff00",
  "code": "potion_small",
  "title": "Small Potion",
  "stackLimit": 99,
  "grants": [
    {
      "type": "hp",
      "value": 50
    }
  ]
} } } })
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

    @ApiBody({ description: "Grant items to a player", examples: { default: { value: {
  "projectId": "66d2a1f5e4aabbccddeeff00",
  "code": "potion_small",
  "playerId": "66d2b3c4e4aabbccddeeff11",
  "qty": 3,
  "reason": "reward:daily_login"
} } } })
    @Post('grant')
    grant(@Req() req: Request, @Body() body: GrantItemDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.grant(tenantId, body);
    }

    @ApiBody({ description: "Consume an item from player inventory", examples: { default: { value: {
  "projectId": "66d2a1f5e4aabbccddeeff00",
  "code": "potion_small",
  "playerId": "66d2b3c4e4aabbccddeeff11",
  "qty": 1,
  "idempotencyKey": "item-consume-001",
  "reason": "use_in_battle"
} } } })
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
