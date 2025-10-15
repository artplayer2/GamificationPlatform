import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminMetricsService } from '../services/metrics.service';

@ApiTags('Admin - Metrics')
@Controller('admin/metrics')
export class AdminMetricsController {
  constructor(private readonly metrics: AdminMetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Global metrics (projects, players, events/month, webhooks)' })
  async global() {
    return this.metrics.globalMetrics();
  }
}