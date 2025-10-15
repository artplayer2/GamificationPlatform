import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Destination, DestinationSchema } from './schemas/destination.schema';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Destination.name, schema: DestinationSchema }]),
    ],
    providers: [DestinationsService],
    controllers: [DestinationsController],
    exports: [DestinationsService],
})
export class DestinationsModule {}
