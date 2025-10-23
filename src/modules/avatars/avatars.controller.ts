import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AvatarsService } from './avatars.service';

@ApiTags('Public')
@Controller('public/avatars')
export class AvatarsController {
  constructor(private readonly avatars: AvatarsService) {}

  @Get(':shortKey')
  @ApiOperation({ summary: 'Get player avatar by short key' })
  async getAvatar(@Param('shortKey') shortKey: string, @Res() res: Response) {
    return this.avatars.streamPublic(undefined as any, res, shortKey);
  }
}