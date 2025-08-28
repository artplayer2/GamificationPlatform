import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { Tx, TxDocument } from './schemas/tx.schema';
import { WalletOpDto } from './dto/wallet.dto';

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @InjectModel(Tx.name) private txModel: Model<TxDocument>,
    ) {}

    async credit(tenantId: string, dto: WalletOpDto) {
        // 1) registra transação idempotente (ou reutiliza)
        const tx = await this.ensureIdempotentTx(tenantId, dto, 'credit');

        // 2) aplica crédito atômico
        const path = `wallet.${dto.currency}`;
        const updated = await this.playerModel.findOneAndUpdate(
            { _id: dto.playerId, tenantId },
            { $inc: { [path]: dto.amount } },
            { new: true },
        );
        if (!updated) throw new NotFoundException('Player not found');

        return { playerId: updated.id, wallet: updated.wallet, txId: tx.id, type: 'credit' as const };
    }

    async debit(tenantId: string, dto: WalletOpDto) {
        // 1) registra transação idempotente (ou reutiliza)
        const tx = await this.ensureIdempotentTx(tenantId, dto, 'debit');

        // 2) débito atômico com verificação de saldo
        const path = `wallet.${dto.currency}`;
        const updated = await this.playerModel.findOneAndUpdate(
            { _id: dto.playerId, tenantId, [path]: { $gte: dto.amount } },
            { $inc: { [path]: -dto.amount } },
            { new: true },
        );

        if (!updated) {
            // pode ter sido player inexistente OU saldo insuficiente
            const player = await this.playerModel.findOne({ _id: dto.playerId, tenantId }).lean();
            if (!player) throw new NotFoundException('Player not found');
            throw new BadRequestException('Insufficient funds');
        }

        return { playerId: updated.id, wallet: updated.wallet, txId: tx.id, type: 'debit' as const };
    }

    private async ensureIdempotentTx(
        tenantId: string,
        dto: WalletOpDto,
        type: 'credit' | 'debit',
    ) {
        try {
            const tx = await this.txModel.create({
                tenantId,
                playerId: dto.playerId,
                currency: dto.currency,
                type,
                amount: dto.amount,
                idempotencyKey: dto.idempotencyKey,
                reason: dto.reason,
            });
            return tx;
        } catch (err: any) {
            // erro de índice único → transação já registrada
            if (err?.code === 11000) {
                const existing = await this.txModel.findOne({ tenantId, idempotencyKey: dto.idempotencyKey });
                if (!existing) throw new ConflictException('Idempotency conflict');
                // retornamos a transação existente (idempotência)
                return existing;
            }
            throw err;
        }
    }
    async balance(tenantId: string, playerId: string) {
        const player = await this.playerModel.findOne(
            { _id: playerId, tenantId },
            { wallet: 1 },
        ).lean();

        if (!player) throw new NotFoundException('Player not found');
        return { playerId, wallet: player.wallet };
    }
}
