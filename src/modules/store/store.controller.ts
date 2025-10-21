import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiHeader, ApiQuery, ApiTags, ApiBody, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { PurchaseDto } from './dto/purchase.dto';
import { PlayerAuthGuard } from '../common/guards/player.guard';
import { ApiKeyAuthGuard } from '../common/guards/apikey.guard';

@ApiTags('Store')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (e.g. demo)',
    required: true,
})
@Controller('store')
export class StoreController {
    constructor(private readonly svc: StoreService) {}

    @Post('skus')
    @ApiSecurity('Tenant')
    @ApiSecurity('ApiKey')
    @UseGuards(ApiKeyAuthGuard)
    createSku(@Req() req: Request, @Body() body: CreateSkuDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.createSku(tenantId, body);
    }

    @Get('skus')
    @ApiQuery({ name: 'projectId', required: true })
    @ApiSecurity('Tenant')
    @ApiSecurity('ApiKey')
    @UseGuards(ApiKeyAuthGuard)
    listSkus(@Req() req: Request, @Query('projectId') projectId: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.listSkus(tenantId, projectId);
    }

    @ApiBody({ description: "Place an idempotent store purchase order", examples: { default: { value: {
  "projectId": "66d2a1f5e4aabbccddeeff00",
  "skuCode": "bundle_potions_small",
  "playerId": "66d2b3c4e4aabbccddeeff11",
  "qty": 1,
  "idempotencyKey": "order-0001-a",
  "reason": "promo:launch"
} } } })
    @Post('purchase')
    @ApiBearerAuth()
    @UseGuards(PlayerAuthGuard)
    purchase(@Req() req: Request, @Body() body: PurchaseDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.purchase(tenantId, body);
    }
}
