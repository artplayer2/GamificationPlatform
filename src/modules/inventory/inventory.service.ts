import { BadRequestException, ConflictException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { Tx, TxDocument } from './schemas/tx.schema';
import { WalletOpDto } from './dto/wallet.dto';
import { WalletTxQueryDto } from './dto/wallet-tx-query.dto';
import { EventsService } from '../events/events.service';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { PlansService } from '../plans/plans.service';

type EnsureResult = { tx: TxDocument; isNew: boolean };

@Injectable()
export class InventoryService {
    constructor(
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(Tx.name) private txModel: Model<TxDocument>,
        @Inject(forwardRef(() => EventsService)) private readonly events: EventsService,
        private readonly plans: PlansService,
    ) {}

    async balance(tenantId: string, playerId: string) {
        const player = await this.playerModel.findOne(
            { _id: playerId, tenantId },
            { wallet: 1, projectId: 1 }
        ).lean();
        if (!player) throw new NotFoundException('Player not found');
        const project = await this.projectModel.findOne({ _id: player.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');
        const plan = await this.plans.getByCode((project as any).plan ?? 'free');
        if (!plan.features.inventoryEnabled) throw new BadRequestException('Inventory feature disabled by plan');
        return { playerId, wallet: player.wallet, projectId: player.projectId?.toString?.() ?? (player as any).projectId };
    }

    async credit(tenantId: string, dto: WalletOpDto) {
        const playerLean = await this.playerModel.findOne({ _id: dto.playerId, tenantId }, { wallet: 1, projectId: 1 }).lean();
        if (!playerLean) throw new NotFoundException('Player not found');
        const project = await this.projectModel.findOne({ _id: playerLean.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');
        const plan = await this.plans.getByCode((project as any).plan ?? 'free');
        if (!plan.features.inventoryEnabled) throw new BadRequestException('Inventory feature disabled by plan');

        const { tx, isNew } = await this.ensureIdempotentTx(tenantId, dto, 'credit');
        if (!isNew) {
            return { playerId: dto.playerId, wallet: playerLean.wallet, txId: tx.id, type: 'credit' as const, idempotent: true };
        }

        const path = `wallet.${dto.currency}`;
        const updated = await this.playerModel.findOneAndUpdate(
            { _id: dto.playerId, tenantId },
            { $inc: { [path]: dto.amount } },
            { new: true },
        );
        if (!updated) throw new NotFoundException('Player not found');

        await this.events.log({
            tenantId,
            projectId: updated.projectId?.toString?.() ?? (updated as any).projectId,
            type: 'wallet.credited',
            playerId: dto.playerId,
            payload: {
                currency: dto.currency,
                amount: dto.amount,
                reason: dto.reason ?? null,
                idempotencyKey: dto.idempotencyKey,
                balance: updated.wallet,
            },
        });

        return { playerId: updated.id, wallet: updated.wallet, txId: tx.id, type: 'credit' as const, idempotent: false };
    }

    async debit(tenantId: string, dto: WalletOpDto) {
        const playerLean = await this.playerModel.findOne({ _id: dto.playerId, tenantId }, { wallet: 1, projectId: 1 }).lean();
        if (!playerLean) throw new NotFoundException('Player not found');
        const project = await this.projectModel.findOne({ _id: playerLean.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');
        const plan = await this.plans.getByCode((project as any).plan ?? 'free');
        if (!plan.features.inventoryEnabled) throw new BadRequestException('Inventory feature disabled by plan');

        const { tx, isNew } = await this.ensureIdempotentTx(tenantId, dto, 'debit');
        if (!isNew) {
            return { playerId: dto.playerId, wallet: playerLean.wallet, txId: tx.id, type: 'debit' as const, idempotent: true };
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

        await this.events.log({
            tenantId,
            projectId: updated.projectId?.toString?.() ?? (updated as any).projectId,
            type: 'wallet.debited',
            playerId: dto.playerId,
            payload: {
                currency: dto.currency,
                amount: dto.amount,
                reason: dto.reason ?? null,
                idempotencyKey: dto.idempotencyKey,
                balance: updated.wallet,
            },
        });

        return { playerId: updated.id, wallet: updated.wallet, txId: tx.id, type: 'debit' as const, idempotent: false };
    }

    async listWalletTx(tenantId: string, q: WalletTxQueryDto) {
        return this.listTx(tenantId, q);
    }

    async listTx(tenantId: string, q: WalletTxQueryDto) {
        const filter: any = { tenantId };
        if (q.playerId) filter.playerId = q.playerId;
        if (q.currency) filter.currency = q.currency;
        if (q.type)     filter.type = q.type; // 'credit' | 'debit'
        if (q.after)    filter.createdAt = { ...(filter.createdAt || {}), $gte: new Date(q.after) };
        if (q.before)   filter.createdAt = { ...(filter.createdAt || {}), $lte: new Date(q.before) };

        const limit = Math.min(q.limit ?? 50, 200);
        const cursorFilter = q.cursor ? { _id: { $lt: new Types.ObjectId(q.cursor) } } : {};
        const list = await this.txModel.find({ ...filter, ...cursorFilter }).sort({ _id: -1 }).limit(limit).lean();
        const nextCursor = list.length ? list[list.length - 1]._id.toString() : null;
        return {
            results: list.map(r => ({ id: r._id.toString(), ...r })),
            nextCursor,
        };
    }

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
                amount: dto.amount,
                reason: dto.reason,
                idempotencyKey: dto.idempotencyKey,
                type,
            });
            return { tx, isNew: true };
        } catch (err: any) {
            if (err?.code !== 11000) throw err;
            const tx = await this.txModel.findOne({ tenantId, idempotencyKey: dto.idempotencyKey });
            if (!tx) throw new ConflictException('Idempotency broken: tx not found after duplicate key');
            return { tx, isNew: false };
        }
    }
}
