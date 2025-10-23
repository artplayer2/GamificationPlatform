import { Global, Module } from '@nestjs/common';
import { RateLimitRedisService } from './rate-limit.service';

@Global()
@Module({
  providers: [RateLimitRedisService],
  exports: [RateLimitRedisService],
})
export class RateLimitModule {}