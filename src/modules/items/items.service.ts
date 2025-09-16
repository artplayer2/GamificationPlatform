import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ItemDef, ItemDefDocument } from './schemas/item-def.schema';
import { PlayerItem, PlayerItemDocument } from './schemas/player-item.schema';
import { ItemTx, ItemTxDocument } from './schemas/item-tx.schema';
import { CreateItemDefDto } from './dto/create-item-def.dto';
import { GrantItemDto } from './dto/grant-item.dto';
import { ConsumeItemDto } from './dto/consume-item.dto';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Player, PlayerDocument } from '../players/schemas/player.schema';
import { EventsService } from '../events/events.service';

@Injectable()
export class ItemsService {
    constructor(
        @InjectModel(ItemDef.name) private defModel: Model<ItemDefDocument>,
        @InjectModel(PlayerItem.name) private piModel: Model<PlayerItemDocument>,
        @InjectModel(ItemTx.name) private txModel: Model<ItemTxDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
        private readonly events: EventsService,
    ) {}

    // ====== Definições ======
    async createDef(tenantId: string, dto: CreateItemDefDto) {
        const project = await this.projectModel.findOne({ _id: dto.projectId, tenantId }).lean();
        if (!project) throw new NotFoundException('Project not found for this tenant');

        try {
            return await this.defModel.create({
                tenantId,
                projectId: dto.projectId,
                code: dto.code,
                name: dto.name,
                description: dto.description ?? null,
                stackable: dto.stackable ?? true,
                type: dto.type ?? 'consumable',
                imageUrl: dto.imageUrl ?? null,
            });
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new ConflictException('Item code already exists for this project');
            }
            throw err;
        }
    }

    async listDefs(tenantId: string, projectId: string) {
        return this.defModel.find({ tenantId, projectId }).sort({ code: 1 }).lean();
    }

    // ====== Grant ======
    async grant(tenantId: string, dto: GrantItemDto) {
        // idempotência
        const existingTx = await this.txModel.findOne({ tenantId, idempotencyKey: dto.idempotencyKey }).lean();
        if (existingTx) {
            const inv = await this.piModel.findOne({ tenantId, projectId: dto.projectId, playerId: dto.playerId, code: dto.code }).lean();
            return { idempotent: true, qty: inv?.qty ?? 0 };
        }

        // validações
        const def = await this.defModel.findOne({ tenantId, projectId: dto.projectId, code: dto.code }).lean();
        if (!def) throw new NotFoundException('Item definition not found');

        const player = await this.playerModel.findOne({ _id: dto.playerId, tenantId, projectId: dto.projectId }).lean();
        if (!player) throw new NotFoundException('Player not found in this project');

        // aplica
        const updated = await this.piModel.findOneAndUpdate(
            { tenantId, projectId: dto.projectId, playerId: dto.playerId, code: dto.code },
            { $inc: { qty: dto.qty } },
            { new: true, upsert: true },
        );

        // registra tx
        await this.txModel.create({
            tenantId,
            idempotencyKey: dto.idempotencyKey,
            type: 'grant',
            payload: { ...dto },
        });

        // evento
        await this.events.log({
            tenantId,
            projectId: dto.projectId,
            type: 'item.granted',
            playerId: dto.playerId,
            payload: { code: dto.code, qty: dto.qty, reason: dto.reason ?? null },
        });

        return { idempotent: false, qty: updated.qty };
    }

    // ====== Consume ======
    async consume(tenantId: string, dto: ConsumeItemDto) {
        const existingTx = await this.txModel.findOne({ tenantId, idempotencyKey: dto.idempotencyKey }).lean();
        if (existingTx) {
            const inv = await this.piModel.findOne({ tenantId, projectId: dto.projectId, playerId: dto.playerId, code: dto.code }).lean();
            return { idempotent: true, qty: inv?.qty ?? 0 };
        }

        const def = await this.defModel.findOne({ tenantId, projectId: dto.projectId, code: dto.code }).lean();
        if (!def) throw new NotFoundException('Item definition not found');

        const player = await this.playerModel.findOne({ _id: dto.playerId, tenantId, projectId: dto.projectId }).lean();
        if (!player) throw new NotFoundException('Player not found in this project');

        const inv = await this.piModel.findOne({ tenantId, projectId: dto.projectId, playerId: dto.playerId, code: dto.code }).lean();
        const current = inv?.qty ?? 0;
        if (current < dto.qty) {
            throw new BadRequestException('Insufficient item quantity');
        }

        const updated = await this.piModel.findOneAndUpdate(
            { tenantId, projectId: dto.projectId, playerId: dto.playerId, code: dto.code },
            { $inc: { qty: -dto.qty } },
            { new: true },
        );

        await this.txModel.create({
            tenantId,
            idempotencyKey: dto.idempotencyKey,
            type: 'consume',
            payload: { ...dto },
        });

        await this.events.log({
            tenantId,
            projectId: dto.projectId,
            type: 'item.consumed',
            playerId: dto.playerId,
            payload: { code: dto.code, qty: dto.qty, reason: dto.reason ?? null },
        });

        return { idempotent: false, qty: updated?.qty ?? 0 };
    }

    // ====== Listar inventário do player ======
    async listPlayerItems(tenantId: string, projectId: string, playerId: string) {
        const items = await this.piModel.find({ tenantId, projectId, playerId }).lean();
        return items.map(i => ({ code: i.code, qty: i.qty }));
    }
}
