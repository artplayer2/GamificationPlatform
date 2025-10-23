import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientAuthGuard } from '../../common/guards/client.guard';
import { TenantsService } from '../../tenants/tenants.service';
import { EmailService } from '../../email/email.service';

class UpdateProfileDto {
  email?: string;
}

@ApiTags('Client - Account')
@ApiBearerAuth('ClientBearer')
@Controller('client')
export class ClientAccountController {
  constructor(private readonly tenants: TenantsService, private readonly email: EmailService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get my client profile (tenant + user)' })
  @UseGuards(ClientAuthGuard)
  async getProfile(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    const user = (req as any).clientUser as any;
    const tenant = await this.tenants.getTenantById(tenantId);
    return {
      tenant: { id: tenant?._id?.toString?.() ?? tenantId, code: tenant?.code ?? null, name: tenant?.name ?? null, plan: tenant?.plan ?? null },
      user,
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update my profile (email)' })
  @UseGuards(ClientAuthGuard)
  async updateProfile(@Req() req: Request, @Body() body: UpdateProfileDto) {
    const tenantId = (req as any).tenantId as string;
    const user = (req as any).clientUser as any;
    if (!body.email) return { updated: false };
    const { userModel }: any = (this.tenants as any);
    const email = body.email.toLowerCase().trim();
    await userModel.updateOne({ _id: user.id, tenantId }, { email, verifiedAt: null }).exec();
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const tenant = await this.tenants.getTenantById(tenantId);
    await this.tenants.setVerifyToken(tenantId, email, token);
    await this.email.sendClientVerifyEmail(tenant?.code ?? '', email, token);
    return { updated: true, verifyEmailSent: true };
  }
}