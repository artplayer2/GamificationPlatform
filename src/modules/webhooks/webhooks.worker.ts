import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhooksService } from './webhooks.service';

@Injectable()
export class WebhooksWorker {
    private readonly logger = new Logger(WebhooksWorker.name);

    constructor(private readonly webhooks: WebhooksService) {}

    // Executa a cada 5 segundos
    @Cron(CronExpression.EVERY_5_SECONDS)
    async handleCron() {
        try {
            await this.webhooks.pollAndDeliverBatch(20);
        } catch (err: any) {
            this.logger.error(`Erro no worker de webhooks: ${err?.message || err}`);
        }
    }
}