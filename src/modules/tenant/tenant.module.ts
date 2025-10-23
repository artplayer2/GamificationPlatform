import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantContextMiddleware } from '../../common/middleware/tenant-context.middleware';
import { TenantRateLimitMiddleware } from '../../common/middleware/rate-limit.middleware';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [RateLimitModule, TenantsModule, PlansModule],
})
export class TenantModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(TenantRateLimitMiddleware, TenantContextMiddleware)
            .forRoutes('*');
    }
}