import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sku, SkuDocument } from './schemas/sku.schema';
import { Order, OrderDocument } from './schemas/order.schema';
import { OrderTx, OrderTxDocument } from './schemas/order-tx.schema';
import { CreateSkuDto } from './dto/create-sku.dto';
import { PurchaseDto } from './dto/purchase.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { ItemsService } from '../items/items.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class StoreService {
    constructor(
        @InjectModel(Sku.name) private skuModel: Model<SkuDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(OrderTx.name) private txModel: Model<OrderTxDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        private readonly items: ItemsService,
        private readonly events: EventsService,
    ) {}

    // ======= SKUs =======
    async createSku(tenantId: string, dto: CreateSkuDto) {
        const project = await this.projectModel.findOne({ _id: dto.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');
        if ((dto.priceSoft ?? 0) <= 0 && (dto.priceHard ?? 0) <= 0) {
            throw new BadRequestException('At least one price must be > 0');
        }

        try {
            return await this.skuModel.create({
                tenantId,
                projectId: dto.projectId,
                code: dto.code,
                title: dto.title,
                description: dto.description ?? null,
                priceSoft: dto.priceSoft ?? 0,
                priceHard: dto.priceHard ?? 0,
                items: dto.items ?? [],
                imageUrl: dto.imageUrl ?? null,
            });
        } catch (err: any) {
            if (err?.code === 11000) throw new ConflictException('SKU code already exists for this project');
            throw err;
        }
    }

    async listSkus(tenantId: string, projectId: string) {
        return this.skuModel.find({ tenantId, projectId }).sort({ code: 1 }).lean();
    }

    // ======= Purchase (idempotente) =======
    async purchase(tenantId: string, dto: PurchaseDto) {
        // idempotência por operação
        let isNew = false;
        try {
            await this.txModel.create({ tenantId, idempotencyKey: dto.idempotencyKey });
            isNew = true;
        } catch (e: any) {
            if (e?.code !== 11000) throw e;
            const existing = await this.orderModel.findOne({ tenantId, idempotencyKey: dto.idempotencyKey }).lean();
            return existing
                ? { ...existing, idempotent: true }
                : { idempotent: true, pending: true };
        }

        const project = await this.projectModel.findOne({ _id: dto.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');

        // ⚠️ busca lean só para validar o projectId
        const playerLean = await this.playerModel.findOne({ _id: dto.playerId, tenantId }, { projectId: 1, wallet: 1 }).lean();
        if (!playerLean) throw new NotFoundException('Player not found');
        if (playerLean.projectId !== dto.projectId) {
            throw new BadRequestException(`Player belongs to a different project. expected=${dto.projectId} actual=${playerLean.projectId}`);
        }

        const sku = await this.skuModel.findOne({ tenantId, projectId: dto.projectId, code: dto.skuCode }).lean();
        if (!sku) throw new NotFoundException('SKU not found');

        const times = dto.qty;
        const costSoft = (sku.priceSoft ?? 0) * times;
        const costHard = (sku.priceHard ?? 0) * times;

        // ✅ débito atômico com checagem de saldo
        const updatedPlayer = await this.playerModel.findOneAndUpdate(
            {
                _id: dto.playerId,
                tenantId,
                projectId: dto.projectId,
                'wallet.soft': { $gte: costSoft },
                'wallet.hard': { $gte: costHard },
            },
            {
                $inc: {
                    'wallet.soft': -costSoft,
                    'wallet.hard': -costHard,
                },
            },
            { new: true }
        );

        if (!updatedPlayer) {
            // decide qual saldo faltou (mensagem amigável)
            const softOk = (playerLean.wallet?.soft ?? 0) >= costSoft;
            const hardOk = (playerLean.wallet?.hard ?? 0) >= costHard;
            if (!softOk && !hardOk) throw new BadRequestException('Insufficient soft and hard balance');
            if (!softOk) throw new BadRequestException('Insufficient soft balance');
            if (!hardOk) throw new BadRequestException('Insufficient hard balance');
            throw new BadRequestException('Insufficient balance'); // fallback
        }

        // concede itens (idempotência por item usando sufixo na key)
        for (const it of sku.items) {
            const itemKey = `${dto.idempotencyKey}:sku:${sku.code}:${it.code}`;
            await this.items.grant(tenantId, {
                projectId: dto.projectId,
                playerId: dto.playerId,
                code: it.code,
                qty: it.qty * times,
                idempotencyKey: itemKey,
                reason: `store:${sku.code}`,
            });
        }

        const order = await this.orderModel.create({
            tenantId,
            projectId: dto.projectId,
            playerId: dto.playerId,
            skuCode: sku.code,
            qty: times,
            paidSoft: costSoft,
            paidHard: costHard,
            items: sku.items.map(i => ({ code: i.code, qty: i.qty * times })),
            idempotencyKey: dto.idempotencyKey,
        });

        await this.txModel.updateOne(
            { tenantId, idempotencyKey: dto.idempotencyKey },
            { $set: { resultSnapshot: { orderId: order._id.toString() } } },
        );

        await this.events.log({
            tenantId,
            projectId: dto.projectId,
            type: 'store.purchase.succeeded',
            playerId: dto.playerId,
            payload: {
                skuCode: sku.code,
                qty: times,
                paidSoft: costSoft,
                paidHard: costHard,
                items: order.items,
                reason: dto.reason ?? null,
            },
        });

        return {
            idempotent: !isNew,
            orderId: order._id.toString(),
            paidSoft: costSoft,
            paidHard: costHard,
            items: order.items,
            wallet: updatedPlayer.wallet, // conveniente no retorno
        };
    }
}
