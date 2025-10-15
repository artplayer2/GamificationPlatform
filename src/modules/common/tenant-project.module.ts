import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantProjectValidator } from './tenant-project.validator';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    ],
    providers: [TenantProjectValidator],
    exports: [TenantProjectValidator],
})
export class TenantProjectModule {}
