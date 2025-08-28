import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantContextMiddleware } from '../../common/middleware/tenant-context.middleware';

@Module({})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
