import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminMetricsService } from '../services/metrics.service';
import { AdminApiKeyAuthGuard } from '../../common/guards/admin.guard';

@ApiTags('Admin - Metrics')
@ApiHeader({ name: 'x-tenant-id', description: 'Tenant ID (e.g. demo)', required: true })
@ApiSecurity('Tenant')
@ApiSecurity('ApiKey')
@Controller('admin/metrics')
export class AdminMetricsController {
  constructor(private readonly metrics: AdminMetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Global metrics (projects, players, events/month, webhooks)' })
  @UseGuards(AdminApiKeyAuthGuard)
  async global() {
    return this.metrics.globalMetrics();
  }
}