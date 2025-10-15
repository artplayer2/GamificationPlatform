import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

class CreateProjectDto {
    name!: string;
    plan?: string;
    metadata?: Record<string, any>;
}

@ApiTags('Projects')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (e.g., demo)',
    required: true,
})
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projects: ProjectsService) {}

    @ApiOperation({ summary: 'Create project' })
    @ApiBody({
        schema: {
            example: {
                name: 'My Game',
                plan: 'free',
                metadata: { studio: 'Acme' },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Project created',
    })
    @ApiBody({ description: "Create a new project", examples: { default: { value: {
  "name": "demo",
  "plan": "free"
} } } })
    @Post()
    async create(@Req() req: Request, @Body() body: CreateProjectDto) {
        const tenantId = (req as any).tenantId as string;
        return this.projects.create(tenantId, body);
    }

    @ApiOperation({ summary: 'List tenant projects' })
    @ApiResponse({ status: 200, description: 'Array of projects' })
    @Get()
    async list(@Req() req: Request) {
        const tenantId = (req as any).tenantId as string;
        return this.projects.list(tenantId);
    }

    @ApiOperation({ summary: 'Get project by id' })
    @ApiResponse({ status: 200, description: 'Project details' })
    @Get(':id')
    async get(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        return this.projects.get(tenantId, id);
    }
}
