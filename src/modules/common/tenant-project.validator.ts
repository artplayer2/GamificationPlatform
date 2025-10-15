import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

@Injectable()
export class TenantProjectValidator {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    ) {}

    async ensureProject(tenantId: string, projectId: string): Promise<void> {
        if (!tenantId) throw new BadRequestException('Missing tenantId');
        if (!projectId) throw new BadRequestException('projectId is required');
        if (!Types.ObjectId.isValid(projectId)) throw new BadRequestException('Invalid projectId');

        const exists = await this.projectModel.exists({ _id: projectId, tenantId });
        if (!exists) throw new NotFoundException('Project not found for this tenant');
    }

    async ensureOptionalProject(tenantId: string, maybeProjectId?: string | null): Promise<void> {
        if (!maybeProjectId) return;
        await this.ensureProject(tenantId, maybeProjectId);
    }
}
