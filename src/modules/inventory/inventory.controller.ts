import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { InventoryService } from './inventory.service';
import { WalletOpDto } from './dto/wallet.dto';
import { WalletTxQueryDto } from './dto/wallet-tx-query.dto';
import { ApiHeader, ApiQuery, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('Inventory')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (e.g. demo)',
    required: true,
})
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inv: InventoryService) {}

    @ApiBody({ description: "Credit a player's wallet", examples: { default: { value: {
  "playerId": "66d2b3c4e4aabbccddeeff11",
  "currency": "soft",
  "amount": 100,
  "idempotencyKey": "op-123456",
  "reason": "purchase:small_pack"
} } } })
    @Post('wallet/credit')
    credit(@Req() req: Request, @Body() body: WalletOpDto) {
        const tenantId = (req as any).tenantId as string;
        return this.inv.credit(tenantId, body);
    }

    @ApiBody({ description: "Debit a player's wallet", examples: { default: { value: {
  "playerId": "66d2b3c4e4aabbccddeeff11",
  "currency": "hard",
  "amount": 10,
  "idempotencyKey": "op-123457",
  "reason": "store:buy_item"
} } } })
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
