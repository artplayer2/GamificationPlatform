import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantsService } from '../tenants/tenants.service';
import { ClientAuthService } from './client-auth.service';
import { EmailService } from '../email/email.service';

class RegisterClientDto {
  tenantCode!: string;
  tenantName!: string;
  email!: string;
  password!: string;
}

class LoginClientDto {
  tenantCode!: string;
  email!: string;
  password!: string;
}

class VerifyEmailDto {
  tenantCode!: string;
  email!: string;
  token!: string;
}

class ForgotPasswordDto {
  tenantCode!: string;
  email!: string;
}

class ResetPasswordDto {
  tenantCode!: string;
  email!: string;
  token!: string;
  newPassword!: string;
}

@ApiTags('Client Auth')
@Controller('auth/client')
export class ClientAuthController {
  constructor(
    private readonly tenants: TenantsService,
    private readonly auth: ClientAuthService,
    private readonly email: EmailService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register tenant (free plan) + owner user' })
  @ApiBody({ schema: { example: { tenantCode: 'demo', tenantName: 'Demo Tenant', email: 'owner@demo.com', password: 'Str0ngP@ss' } } })
  async register(@Body() body: RegisterClientDto) {
    const { tenantCode, tenantName, email, password } = body;
    const t = await this.tenants.createTenant(tenantCode, tenantName, 'free');
    const passwordHash = this.auth.hashPassword(password);
    const owner = await this.tenants.createOwnerUser(t._id.toString(), email.toLowerCase().trim(), passwordHash);

    // Issue verify token and send email
    const verifyToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    await this.tenants.setVerifyToken(t._id.toString(), owner.email, verifyToken);
    await this.email.sendClientVerifyEmail(t.code, owner.email, verifyToken);

    return { tenant: { id: t._id.toString(), code: t.code, name: t.name, plan: t.plan }, owner: { id: owner._id?.toString?.() ?? undefined, email: owner.email }, verifyEmailSent: true };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login tenant user by email/password' })
  @ApiBody({ schema: { example: { tenantCode: 'demo', email: 'owner@demo.com', password: 'Str0ngP@ss' } } })
  async login(@Body() body: LoginClientDto) {
    const { tenantCode, email, password } = body;
    const tenant = await this.tenants.getTenantByCode(tenantCode);
    if (!tenant) throw new Error('Tenant not found');
    const { userModel }: any = (this.tenants as any);
    const doc = await userModel.findOne({ tenantId: tenant._id.toString(), email: email.toLowerCase().trim() }).exec();
    if (!doc || !doc.passwordHash) throw new Error('Invalid credentials');
    const ok = this.auth.verifyPassword(password, doc.passwordHash);
    if (!ok) throw new Error('Invalid credentials');

    const token = this.auth.signToken({
      sub: doc._id.toString(),
      tenantId: tenant._id.toString(),
      email: doc.email,
      role: doc.role,
      scopes: ['client:read'],
    });

    return { tokenType: 'Bearer', accessToken: token, expiresIn: process.env.CLIENT_JWT_EXPIRES_IN ?? '1h', user: { id: doc._id.toString(), email: doc.email, role: doc.role }, tenant: { id: tenant._id.toString(), code: tenant.code, name: tenant.name } };
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    const { tenantCode, email, token } = body;
    const tenant = await this.tenants.getTenantByCode(tenantCode);
    if (!tenant) throw new Error('Tenant not found');
    await this.tenants.verifyEmail(tenant._id.toString(), email.toLowerCase().trim(), token);
    return { verified: true };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Issue reset token and send email' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const { tenantCode, email } = body;
    const tenant = await this.tenants.getTenantByCode(tenantCode);
    if (!tenant) throw new Error('Tenant not found');
    const resetToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    await this.tenants.setResetToken(tenant._id.toString(), email.toLowerCase().trim(), resetToken);
    await this.email.sendClientResetEmail(tenant.code, email.toLowerCase().trim(), resetToken);
    return { resetEmailSent: true };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    const { tenantCode, email, token, newPassword } = body;
    const tenant = await this.tenants.getTenantByCode(tenantCode);
    if (!tenant) throw new Error('Tenant not found');
    const passwordHash = this.auth.hashPassword(newPassword);
    await this.tenants.resetPassword(tenant._id.toString(), email.toLowerCase().trim(), token, passwordHash);
    return { reset: true };
  }
}