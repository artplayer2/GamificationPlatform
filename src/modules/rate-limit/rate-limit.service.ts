import { Injectable, Logger } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RateLimitRedisService {
  private client?: Redis;
  private readonly logger = new Logger(RateLimitRedisService.name);
  private createOptions!: RedisOptions;
  private createUrl?: string;

  constructor() {
    const commonOptions: RedisOptions = {
      maxRetriesPerRequest: 0,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: () => null,
    } as const;

    const url = process.env.REDIS_URL;
    if (url) {
      this.createUrl = url;
      this.createOptions = commonOptions;
    } else {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT || 6379);
      const password = process.env.REDIS_PASSWORD || undefined;
      this.createOptions = { host, port, password, ...commonOptions };
    }
  }

  private ensureClient(): Redis {
    if (!this.client) {
      this.client = this.createUrl ? new Redis(this.createUrl, this.createOptions) : new Redis(this.createOptions);
      this.client.on('error', (err) => this.logger.error(`Redis error: ${err?.message || err}`));
    }
    return this.client;
  }

  // Fixed-window per-minute increment and check
  async checkPerMinute(bucketKey: string, limit: number): Promise<{ allowed: boolean; count: number; limit: number }>
  {
    try {
      const client = this.ensureClient();
      // Connect lazily right before first command, ignore connection errors
      if (!client.status || client.status === 'end') {
        await client.connect().catch((e) => {
          this.logger.warn(`Redis connect failed: ${e?.message || e}`);
        });
      }

      const minute = Math.floor(Date.now() / 60_000);
      const key = `rl:${bucketKey}:${minute}`;
      const count = await client.incr(key);
      if (count === 1) {
        // first hit in this window, set expiry
        await client.expire(key, 60);
      }
      const allowed = count <= Math.max(1, limit || 1);
      return { allowed, count, limit };
    } catch (err: any) {
      this.logger.warn(`Rate limit degraded (Redis unavailable): ${err?.message || err}`);
      // Fallback: allow traffic when Redis is down
      return { allowed: true, count: 0, limit };
    }
  }
}