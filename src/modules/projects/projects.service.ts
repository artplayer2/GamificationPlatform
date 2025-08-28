import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  async create(tenantId: string, dto: CreateProjectDto) {
    const doc = new this.projectModel({
      tenantId,
      name: dto.name,
      publicKey: `pub_${randomUUID()}`,
      secretKey: `sec_${randomUUID()}`,
      features: dto.features ?? [],
    });
    return await doc.save();
  }

  async list(tenantId: string) {
    return this.projectModel.find({ tenantId }).lean();
  }
}
