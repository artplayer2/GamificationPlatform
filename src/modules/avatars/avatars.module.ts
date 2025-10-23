import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Avatar, AvatarSchema } from './schemas/avatar.schema';
import { AvatarsService } from './avatars.service';
import { AvatarsController } from './avatars.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Avatar.name, schema: AvatarSchema }]),
  ],
  providers: [AvatarsService],
  controllers: [AvatarsController],
  exports: [AvatarsService],
})
export class AvatarsModule {}