import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Destination, DestinationSchema } from './schemas/destination.schema';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Destination.name, schema: DestinationSchema },
            { name: Project.name, schema: ProjectSchema }, // 👈 necessário p/ ensureProject
        ]),
    ],
    providers: [DestinationsService],
    controllers: [DestinationsController],
    exports: [DestinationsService],
})
export class DestinationsModule {}
