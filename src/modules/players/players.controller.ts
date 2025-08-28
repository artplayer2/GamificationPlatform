import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Post()
  create(@Req() req: Request, @Body() body: CreatePlayerDto) {
    const tenantId = (req as any).tenantId as string;
    return this.players.create(tenantId, body);
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    const tenantId = (req as any).tenantId as string;
    return this.players.get(tenantId, id);
  }
}
