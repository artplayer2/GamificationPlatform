import { Injectable } from '@nestjs/common';
import { EventsService } from '../../events/events.service';

@Injectable()
export class ClientMetricsService {
  constructor(private readonly events: EventsService) {}

  async projectMetrics(tenantId: string, projectId: string) {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.events.getProjectEventMetrics(tenantId, projectId, start, end);
  }
}