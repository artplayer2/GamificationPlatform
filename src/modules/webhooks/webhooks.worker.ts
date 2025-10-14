import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WebhooksService } from './webhooks.service';

/**
 * Worker simples que varre a fila de entregas pendentes.
 * Rodamos a cada 10 segundos. Em produção você pode ajustar (ou usar BullMQ).
 */
@Injectable()
export class WebhooksWorker {
    private readonly logger = new Logger(WebhooksWorker.name);

    constructor(private readonly webhooks: WebhooksService) {}

    @Cron('*/10 * * * * *') // a cada 10s
    async tick() {
        await this.webhooks.pollAndDeliverBatch(50);
    }
}
