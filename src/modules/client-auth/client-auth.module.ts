import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientAuthService } from './client-auth.service';
import { ClientAuthController } from './client-auth.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    JwtModule.register({
      global: false,
      secret: process.env.CLIENT_JWT_SECRET ?? 'dev-client-secret',
      signOptions: {
        expiresIn: (() => {
          const v = process.env.CLIENT_JWT_EXPIRES_IN;
          const isNum = v && /^\d+$/.test(v);
          return isNum ? Number(v) : 3600; // default 1h in seconds
        })(),
      },
    }),
    TenantsModule,
    EmailModule,
  ],
  controllers: [ClientAuthController],
  providers: [ClientAuthService],
  exports: [ClientAuthService],
})
export class ClientAuthModule {}