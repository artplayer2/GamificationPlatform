import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { Tx, TxDocument } from './schemas/tx.schema';
import { WalletOpDto } from './dto/wallet.dto';
import { WalletTxQueryDto } from './dto/wallet-tx-query.dto';

type EnsureResult = { tx: TxDocument; isNew: boolean };

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @InjectModel(Tx.name) private txModel: Model<TxDocument>,
    ) {}

    async credit(tenantId: string, dto: WalletOpDto) {
        const { tx, isNew } = await this.ensureIdempotentTx(tenantId, dto, 'credit');

        if (!isNew) {
            // ⚖️ idempotente: não aplica de novo; retorna estado atual + tx existente
            const player = await this.playerModel.findOne({ _id: dto.playerId, tenantId }, { wallet: 1 }).lean();
            if (!player) throw new NotFoundException('Player not found');
            return { playerId: dto.playerId, wallet: player.wallet, txId: tx.id, type: 'credit' as const, idempotent: true };
        }

        const path = `wallet.${dto.currency}`;
        const updated = await this.playerModel.findOneAndUpdate(
            { _id: dto.playerId, tenantId },
            { $inc: { [path]: dto.amount } },
            { new: true },
        );
        if (!updated) throw new NotFoundException('Player not found');

        return { playerId: updated.id, wallet: updated.wallet, txId: tx.id, type: 'credit' as const, idempotent: false };
    }

    async debit(tenantId: string, dto: WalletOpDto) {
        const { tx, isNew } = await this.ensureIdempotentTx(tenantId, dto, 'debit');

        if (!isNew) {
            // ⚖️ idempotente: não aplica de novo; retorna estado atual + tx existente
            const player = await this.playerModel.findOne({ _id: dto.playerId, tenantId }, { wallet: 1 }).lean();
            if (!player) throw new NotFoundException('Player not found');
            return { playerId: dto.playerId, wallet: player.wallet, txId: tx.id, type: 'debit' as const, idempotent: true };
        }

        const path = `wallet.${dto.currency}`;
        const updated = await this.playerModel.findOneAndUpdate(
            { _id: dto.playerId, tenantId, [path]: { $gte: dto.amount } },
            { $inc: { [path]: -dto.amount } },
            { new: true },
        );

        if (!updated) {
            const player = await this.playerModel.findOne({ _id: dto.playerId, tenantId }).lean();
            if (!player) throw new NotFoundException('Player not found');
            throw new BadRequestException('Insufficient funds');
        }

        return { playerId: updated.id, wallet: updated.wallet, txId: tx.id, type: 'debit' as const, idempotent: false };
    }

    async balance(tenantId: string, playerId: string) {
        const player = await this.playerModel.findOne(
            { _id: playerId, tenantId },
            { wallet: 1 },
        ).lean();

        if (!player) throw new NotFoundException('Player not found');
        return { playerId, wallet: player.wallet };
    }

    /** Listagem paginada de transações de wallet por _id cursor (desc). */
    async listWalletTx(tenantId: string, q: WalletTxQueryDto) {
        const filter: any = { tenantId };
        if (q.playerId) filter.playerId = q.playerId;
        if (q.currency) filter.currency = q.currency;

        const limit = q.limit ?? 20;

        if (q.after) {
            filter._id = { $lt: new Types.ObjectId(q.after) };
        }

        const rows = await this.txModel
            .find(filter)
            .sort({ _id: -1 })
            .limit(limit)
            .lean<any>(); // ajuda o TS a reconhecer createdAt

        const nextCursor = rows.length === limit ? rows[rows.length - 1]._id.toString() : null;

        return {
            items: rows.map((r: any) => ({
                id: r._id.toString(),
                playerId: r.playerId,
                currency: r.currency,
                type: r.type,
                amount: r.amount,
                reason: r.reason,
                createdAt: r.createdAt, // timestamps precisam estar no schema Tx (já adicionamos)
                idempotencyKey: r.idempotencyKey,
            })),
            nextCursor,
        };
    }

    /** Cria o registro de TX ou retorna o já existente (idempotência forte). */
    private async ensureIdempotentTx(
        tenantId: string,
        dto: WalletOpDto,
        type: 'credit' | 'debit',
    ): Promise<EnsureResult> {
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
            return { tx, isNew: true };
        } catch (err: any) {
            if (err?.code === 11000) {
                const existing = await this.txModel.findOne({ tenantId, idempotencyKey: dto.idempotencyKey });
                if (!existing) throw new ConflictException('Idempotency conflict');
                return { tx: existing, isNew: false };
            }
            throw err;
        }
    }
}
