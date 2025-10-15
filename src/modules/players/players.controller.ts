import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { ApiHeader, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('Players')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (ex.: demo)',
    required: true,
})
@Controller('players')
export class PlayersController {
    constructor(private readonly players: PlayersService) {}

    @ApiBody({ description: "Create a new player", examples: { default: { value: {
  "projectId": "66d2a1f5e4aabbccddeeff00",
  "username": "the_wizard_77"
} } } })
    @Post()
    create(@Req() req: Request, @Body() body: CreatePlayerDto) {
        const tenantId = (req as any).tenantId as string;
        return this.players.create(tenantId, body);
    }

    // 👇 agora retorna consolidado (xp, level, wallet)
    @Get(':id')
    get(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.players.get(tenantId, id);
    }
}
