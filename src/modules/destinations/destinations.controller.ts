// src/modules/destinations/destinations.controller.ts
import {Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req} from '@nestjs/common';
import { Request } from 'express';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';

@ApiTags('Destinations')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (e.g. demo)',
    required: true,
})
@Controller('destinations')
export class DestinationsController {
    constructor(
        private readonly svc: DestinationsService,
        @InjectModel(Project.name) private projects: Model<ProjectDocument>,
    ) {}

    @ApiOperation({ summary: 'Create a new destination (webhook or websocket)' })
    @ApiBody({ type: CreateDestinationDto })
    @ApiResponse({
        status: 201,
        description: 'Destination successfully created',
        schema: {
            example: {
                _id: '670bb870c6f2f843b3da15d4',
                tenantId: 'demo',
                projectId: '66fd43a849b820102950f6f5',
                type: 'webhook',
                eventTypes: ['*'],
                active: true,
                url: 'https://example.com/webhook',
                createdAt: '2025-10-14T20:45:00Z',
            },
        },
    })
    @Post()
    create(@Req() req: Request, @Body() dto: CreateDestinationDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.create(tenantId, dto);
    }

    @ApiOperation({ summary: 'List all destinations (optional filter by projectId)' })
    @ApiResponse({
        status: 200,
        description: 'List of destinations for the tenant',
        schema: {
            example: [
                {
                    _id: '670bb870c6f2f843b3da15d4',
                    projectId: '66fd43a849b820102950f6f5',
                    type: 'webhook',
                    eventTypes: ['player.xp.added'],
                    active: true,
                },
                {
                    _id: '670bb870c6f2f843b3da15d5',
                    projectId: '66fd43a849b820102950f6f5',
                    type: 'websocket',
                    eventTypes: ['*'],
                    active: true,
                },
            ],
        },
    })
    @Get()
    async list(@Req() req: Request, @Query('projectId') projectId?: string) {
        const tenantId = (req as any).tenantId as string;
        if (projectId) {
            const exists = await this.projects.exists({ _id: projectId, tenantId });
            if (!exists) throw new NotFoundException('Project not found for this tenant');
        }
        return this.svc.list(tenantId, projectId);
    }

    @ApiOperation({ summary: 'Get a specific destination by ID' })
    @ApiResponse({ status: 200, description: 'Destination details' })
    @Get(':id')
    get(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.get(tenantId, id);
    }

    @ApiOperation({ summary: 'Update a destination configuration' })
    @ApiBody({ type: UpdateDestinationDto })
    @ApiResponse({ status: 200, description: 'Destination updated successfully' })
    @Patch(':id')
    update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateDestinationDto) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.update(tenantId, id, dto as any);
    }

    @ApiOperation({ summary: 'Delete a destination' })
    @ApiResponse({ status: 204, description: 'Destination deleted' })
    @Delete(':id')
    remove(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.remove(tenantId, id);
    }

    @ApiOperation({ summary: 'Pause destination (set active=false)' })
    @Post(':id/pause')
    pause(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.setActive(tenantId, id, false);
    }

    @ApiOperation({ summary: 'Resume destination (set active=true)' })
    @Post(':id/resume')
    resume(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.svc.setActive(tenantId, id, true);
    }
}
