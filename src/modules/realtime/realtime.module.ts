import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ApiKeysModule } from '../apikeys/apikeys.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
        ApiKeysModule,
    ],
    providers: [RealtimeGateway, RealtimeService],
    exports: [RealtimeService],
})
export class RealtimeModule {}
