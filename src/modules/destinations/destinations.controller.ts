import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@ApiTags('Destinations')
@ApiHeader({ name: 'x-tenant-id', required: true })
@Controller('destinations')
export class DestinationsController {
    constructor(private readonly svc: DestinationsService) {}

    @ApiOperation({ summary: 'Criar destino (webhook/websocket)' })
    @Post()
    create(@Req() req: Request, @Body() dto: CreateDestinationDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.create(tenantId, dto);
    }

    @ApiOperation({ summary: 'Listar destinos (opcional filtrar por projectId)' })
    @Get()
    list(@Req() req: Request, @Query('projectId') projectId?: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.list(tenantId, projectId);
    }

    @ApiOperation({ summary: 'Obter destino por id' })
    @Get(':id')
    get(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.get(tenantId, id);
    }

    @ApiOperation({ summary: 'Atualizar destino' })
    @Patch(':id')
    update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateDestinationDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.update(tenantId, id, dto as any);
    }

    @ApiOperation({ summary: 'Remover destino' })
    @Delete(':id')
    remove(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.remove(tenantId, id);
    }

    @ApiOperation({ summary: 'Pausar destino' })
    @Post(':id/pause')
    pause(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.setActive(tenantId, id, false);
    }

    @ApiOperation({ summary: 'Retomar destino' })
    @Post(':id/resume')
    resume(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.setActive(tenantId, id, true);
    }
}
