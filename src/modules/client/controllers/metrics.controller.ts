import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ClientMetricsService } from '../services/metrics.service';
import { ApiKeyAuthGuard } from '../../common/guards/apikey.guard';

@ApiTags('Client - Metrics')
@Controller('client/metrics')
export class ClientMetricsController {
  constructor(private readonly metrics: ClientMetricsService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get project metrics (requires x-api-key)' })
  @UseGuards(ApiKeyAuthGuard)
  async project(@Req() req: Request, @Param('projectId') projectId: string) {
    const tenantId = (req as any).tenantId as string;
    return this.metrics.projectMetrics(tenantId, projectId);
  }
}