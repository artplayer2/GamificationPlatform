import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Destination, DestinationDocument } from './schemas/destination.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

@Injectable()
export class DestinationsService {
    constructor(
        @InjectModel(Destination.name) private model: Model<DestinationDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    ) {}

    private async ensureProject(tenantId: string, projectId: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        if (!projectId) throw new BadRequestException('projectId is required');
        if (!Types.ObjectId.isValid(projectId)) throw new BadRequestException('Invalid projectId');
        const exists = await this.projectModel.exists({ _id: projectId, tenantId });
        if (!exists) throw new NotFoundException('Project not found for this tenant');
    }

    async create(tenantId: string, dto: Partial<Destination>) {
        await this.ensureProject(tenantId, String(dto.projectId));
        if (dto.type === 'webhook') {
            if (!dto.url) throw new BadRequestException('url is required for webhook destinations');
            if (!dto.secret || String(dto.secret).length < 16) {
                throw new BadRequestException('secret (>=16 chars) is required for webhook destinations');
            }
        }
        return this.model.create({ tenantId, ...dto });
    }

    async list(tenantId: string, projectId?: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        if (projectId) await this.ensureProject(tenantId, projectId);
        const q: any = { tenantId };
        if (projectId) q.projectId = projectId;
        return this.model.find(q).lean().exec();
    }

    async get(tenantId: string, id: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        return this.model.findOne({ _id: id, tenantId }).lean().exec();
    }

    async update(tenantId: string, id: string, patch: Partial<Destination>) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        if (patch.projectId) await this.ensureProject(tenantId, String(patch.projectId));
        if (patch.type === 'webhook') {
            if (patch.url === undefined || patch.secret === undefined) {
                throw new BadRequestException('url and secret are required when type=webhook');
            }
            if ((patch.secret ?? '').length < 16) throw new BadRequestException('secret must be at least 16 chars');
        }
        return this.model.findOneAndUpdate({ _id: id, tenantId }, { $set: patch }, { new: true }).lean().exec();
    }

    async remove(tenantId: string, id: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        return this.model.deleteOne({ _id: id, tenantId }).exec();
    }

    async setActive(tenantId: string, id: string, active: boolean) {
        if (!tenantId) throw new BadRequestException('Missing tenantId header');
        return this.model.findOneAndUpdate(
            { _id: id, tenantId },
            { $set: { active } },
            { new: true },
        ).lean().exec();
    }
}
