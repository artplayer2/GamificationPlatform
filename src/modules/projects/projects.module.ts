import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './projects.service';
import { Project, ProjectSchema } from './schemas/project.schema';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
        forwardRef(() => EventsModule),
    ],
    providers: [ProjectsService],
    exports: [ProjectsService],
})
export class ProjectsModule {}
