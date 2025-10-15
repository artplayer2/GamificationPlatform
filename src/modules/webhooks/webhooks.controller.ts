import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBody } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ListDeliveriesDto } from './dto/list-deliveries.dto';
import { RedriveDeliveriesDto } from './dto/redrive-deliveries.dto';

@ApiTags('Webhooks')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant ID (e.g. demo)', required: true })
@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly webhooks: WebhooksService) {}

    // ----- subscriptions -----
    @ApiOperation({ summary: 'Criar assinatura de webhook' })
    @ApiBody({ description: 'Create a webhook subscription', examples: { default: { value: {
  "projectId": "66d2a1f5e4aabbccddeeff00",
  "url": "https://example.tld/webhooks/ingest",
  "secret": "whsec_9a87c1f2f3a54d0e",
  "eventTypes": [
    "player.created",
    "player.levelup",
    "store.purchase.succeeded"
  ],
  "active": true
} } } })
    @Post('subscriptions')
    create(@Req() req: Request, @Body() dto: CreateSubscriptionDto) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.createSubscription(tenantId, dto);
    }

    @ApiOperation({ summary: 'Listar assinaturas (opcional filtrar por projectId)' })
    @Get('subscriptions')
    list(@Req() req: Request, @Query('projectId') projectId?: string) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.listSubscriptions(tenantId, projectId);
    }

    @ApiOperation({ summary: 'Obter assinatura por id' })
    @Get('subscriptions/:id')
    getOne(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.getSubscription(tenantId, id);
    }

    @ApiOperation({ summary: 'Atualizar assinatura' })
    @Patch('subscriptions/:id')
    update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.updateSubscription(tenantId, id, dto as any);
    }

    @ApiOperation({ summary: 'Remover assinatura' })
    @Delete('subscriptions/:id')
    remove(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.deleteSubscription(tenantId, id);
    }

    @ApiOperation({ summary: 'Pausar assinatura' })
    @Post('subscriptions/:id/pause')
    pause(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.setSubscriptionActive(tenantId, id, false);
    }

    @ApiOperation({ summary: 'Retomar assinatura' })
    @Post('subscriptions/:id/resume')
    resume(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.setSubscriptionActive(tenantId, id, true);
    }

    // ----- deliveries -----
    @ApiOperation({ summary: 'Listar deliveries por filtros' })
    @Get('deliveries')
    listDeliveries(@Req() req: Request, @Query() q: ListDeliveriesDto) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.listDeliveries(tenantId, q);
    }

    @ApiOperation({ summary: 'Obter delivery por id' })
    @Get('deliveries/:id')
    getDelivery(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.getDelivery(tenantId, id);
    }

    @ApiOperation({ summary: 'Redrive (reprocessar) deliveries' })
    @Post('deliveries/redrive')
    redrive(@Req() req: Request, @Body() body: RedriveDeliveriesDto) {
        const tenantId = (req as any).tenantId as string;
        return this.webhooks.redriveDeliveries(tenantId, body);
    }

    // utilitário para tentativa imediata de 1 delivery
    @ApiOperation({ summary: 'Forçar tentativa imediata de um delivery' })
    @Post('deliveries/:id/attempt')
    forceAttempt(@Param('id') id: string) {
        return this.webhooks.attemptDelivery(id);
    }
}
