import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';

export interface CreateProjectInput {
    name: string;
    plan?: string;
    metadata?: Record<string, any>;
}

export interface UpdateProjectInput {
    name?: string;
    plan?: string;
    metadata?: Record<string, any>;
}

@Injectable()
export class ProjectsService {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    ) {}

    async create(tenantId: string, input: CreateProjectInput) {
        if (!tenantId) throw new BadRequestException('Missing tenantId');
        if (!input?.name || typeof input.name !== 'string') {
            throw new BadRequestException('name is required');
        }

        const doc = await this.projectModel.create({
            tenantId,
            name: input.name.trim(),
            // estes campos podem não existir no schema atual — tudo bem:
            plan: input.plan ?? 'free',
            metadata: input.metadata ?? {},
        });

        // Convertemos para objeto plano para evitar erros de tipagem do Mongoose
        const o: any = doc.toObject();

        return {
            id: String(o._id),
            tenantId: o.tenantId,
            name: o.name,
            plan: o.plan ?? 'free',
            metadata: o.metadata ?? {},
            createdAt: o.createdAt ?? null,
            updatedAt: o.updatedAt ?? null,
        };
    }

    async list(tenantId: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId');

        const rows = await this.projectModel
            .find(
                { tenantId },
                // projeção inclui os campos que queremos se existirem
                { name: 1, plan: 1, tenantId: 1, createdAt: 1, updatedAt: 1 },
            )
            .sort({ createdAt: -1 })
            .lean() // já vem objeto plano
            .exec();

        return rows.map((r: any) => ({
            id: String(r._id),
            tenantId: r.tenantId,
            name: r.name,
            plan: r.plan ?? 'free',
            createdAt: r.createdAt ?? null,
            updatedAt: r.updatedAt ?? null,
        }));
    }

    async get(tenantId: string, id: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId');
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid project id');

        const p: any = await this.projectModel
            .findOne(
                { _id: id, tenantId },
                { name: 1, plan: 1, tenantId: 1, metadata: 1, createdAt: 1, updatedAt: 1 },
            )
            .lean()
            .exec();

        if (!p) throw new NotFoundException('Project not found');

        return {
            id: String(p._id),
            tenantId: p.tenantId,
            name: p.name,
            plan: p.plan ?? 'free',
            metadata: p.metadata ?? {},
            createdAt: p.createdAt ?? null,
            updatedAt: p.updatedAt ?? null,
        };
    }

    async findOne(tenantId: string, id: string) {
        return this.get(tenantId, id);
    }

    async update(tenantId: string, id: string, updateProjectInput: UpdateProjectInput) {
        if (!tenantId) throw new BadRequestException('Missing tenantId');
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid project id');

        const project = await this.projectModel.findOne({ _id: id, tenantId }).exec();
        if (!project) throw new NotFoundException('Project not found');

        if (updateProjectInput.name) {
            project.name = updateProjectInput.name.trim();
        }
        
        if (updateProjectInput.plan) {
            project.plan = updateProjectInput.plan;
        }
        
        if (updateProjectInput.metadata) {
            project.metadata = { ...project.metadata, ...updateProjectInput.metadata };
        }

        await project.save();

        const p: any = project.toObject();
        return {
            id: String(p._id),
            tenantId: p.tenantId,
            name: p.name,
            plan: p.plan ?? 'free',
            metadata: p.metadata ?? {},
            createdAt: p.createdAt ?? null,
            updatedAt: p.updatedAt ?? null,
        };
    }

    async remove(tenantId: string, id: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId');
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid project id');

        const result = await this.projectModel.deleteOne({ _id: id, tenantId }).exec();
        
        if (result.deletedCount === 0) {
            throw new NotFoundException('Project not found');
        }

        return { success: true };
    }

    async countProjectsByTenant(tenantId: string) {
        if (!tenantId) throw new BadRequestException('Missing tenantId');
        
        const count = await this.projectModel.countDocuments({ tenantId }).exec();
        return { count };
    }

    async findAllByTenant(tenantId: string) {
        return this.list(tenantId);
    }
}
