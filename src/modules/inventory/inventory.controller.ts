import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { InventoryService } from './inventory.service';
import { WalletOpDto } from './dto/wallet.dto';
import { WalletTxQueryDto } from './dto/wallet-tx-query.dto';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Inventory')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (ex.: demo)',
    required: true,
})
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inv: InventoryService) {}

    @Post('wallet/credit')
    credit(@Req() req: Request, @Body() body: WalletOpDto) {
        const tenantId = (req as any).tenantId as string;
        return this.inv.credit(tenantId, body);
    }

    @Post('wallet/debit')
    debit(@Req() req: Request, @Body() body: WalletOpDto) {
        const tenantId = (req as any).tenantId as string;
        return this.inv.debit(tenantId, body);
    }

    @Get('wallet/balance')
    @ApiQuery({ name: 'playerId', required: true, example: '66d2a2b3e4...' })
    async balance(@Req() req: Request, @Query('playerId') playerId: string) {
        const tenantId = (req as any).tenantId as string;
        return this.inv.balance(tenantId, playerId);
    }

    @Get('wallet/tx')
    async listTx(@Req() req: Request, @Query() query: WalletTxQueryDto) {
        const tenantId = (req as any).tenantId as string;
        return this.inv.listWalletTx(tenantId, query);
    }
}
