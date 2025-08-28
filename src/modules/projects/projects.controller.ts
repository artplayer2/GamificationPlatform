import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import {ApiHeader, ApiTags} from '@nestjs/swagger';

@ApiTags('Projects')
@ApiHeader({
    name: 'x-tenant-id',
    description: 'Tenant ID (ex.: demo)',
    required: true,
})
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  create(@Req() req: Request, @Body() body: CreateProjectDto) {
    const tenantId = (req as any).tenantId as string;
    return this.projects.create(tenantId, body);
  }

  @Get()
  list(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    return this.projects.list(tenantId);
  }
}
