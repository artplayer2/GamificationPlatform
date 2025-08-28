import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantContextMiddleware } from '../../common/middleware/tenant-context.middleware';
import { TenantRateLimitMiddleware } from '../../common/middleware/rate-limit.middleware';

@Module({})
export class TenantModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(TenantRateLimitMiddleware, TenantContextMiddleware)
            .forRoutes('*');
    }
}