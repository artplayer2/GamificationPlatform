import { Body, Controller, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ProjectsService } from '../../projects/projects.service';
import { AdminApiKeyAuthGuard } from '../../common/guards/admin.guard';

class UpdateProjectPlanDto {
  plan!: string; // e.g. 'free', 'pro', 'enterprise'
}

@ApiTags('Admin - Projects')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant ID (e.g. demo)', required: true })
@ApiSecurity('Tenant')
@ApiSecurity('ApiKey')
@UseGuards(AdminApiKeyAuthGuard)
@Controller('admin/projects')
export class AdminProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Patch(':id/plan')
  @ApiOperation({ summary: 'Set project plan (by code)' })
  @ApiBody({ description: 'Update project plan', examples: { default: { value: { plan: 'pro' } } } })
  async setPlan(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateProjectPlanDto) {
    const tenantId = (req as any).tenantId as string;
    return this.projects.update(tenantId, id, { plan: body.plan });
  }
}