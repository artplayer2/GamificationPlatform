import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant ID (ex.: demo)', required: true })
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projects: ProjectsService) {}

    @Post()
    async create(@Req() req: Request, @Body() body: CreateProjectDto) {
        const tenantId = (req as any).tenantId as string;
        const dtoWithTenant: any = { ...body, tenantId };
        // service.create espera 1 argumento (conforme seu erro)
        return (this.projects as any).create(dtoWithTenant);
    }

    @Get()
    async list(@Req() req: Request) {
        const tenantId = (req as any).tenantId as string;
        // chama a que existir no seu service (compat forward-friendly)
        if (typeof (this.projects as any).list === 'function') {
            return (this.projects as any).list(tenantId);
        }
        if (typeof (this.projects as any).findAllByTenant === 'function') {
            return (this.projects as any).findAllByTenant(tenantId);
        }
        if (typeof (this.projects as any).findAll === 'function') {
            return (this.projects as any).findAll(tenantId);
        }
        // fallback simples
        return [];
    }

    @Get(':id')
    async get(@Req() req: Request, @Param('id') id: string) {
        const tenantId = (req as any).tenantId as string;
        if (typeof (this.projects as any).get === 'function') {
            return (this.projects as any).get(tenantId, id);
        }
        if (typeof (this.projects as any).findOne === 'function') {
            return (this.projects as any).findOne(tenantId, id);
        }
        return {};
    }
}
