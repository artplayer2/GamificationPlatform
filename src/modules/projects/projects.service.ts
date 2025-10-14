import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { EventsService } from '../events/events.service';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @Inject(forwardRef(() => EventsService)) private readonly events: EventsService,
    ) {}

    async create(params: { tenantId: string; name: string; /* ... */ }) {
        const project = await this.projectModel.create({
            tenantId: params.tenantId,
            name: params.name,
            // ...
        });

        await this.events.log({
            tenantId: params.tenantId,
            projectId: project._id.toString(),
            type: 'project.created',
            payload: { name: project.name },
        });

        return project;
    }
}
