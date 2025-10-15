import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    ],
    providers: [RealtimeGateway, RealtimeService],
    exports: [RealtimeService],
})
export class RealtimeModule {}
