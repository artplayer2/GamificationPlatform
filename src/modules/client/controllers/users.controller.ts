import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClientAuthGuard } from '../../common/guards/client.guard';
import { TenantsService } from '../../tenants/tenants.service';
import { EmailService } from '../../email/email.service';

class CreateUserDto {
  email!: string;
  role?: 'owner'|'admin'|'viewer';
}

class UpdateUserDto {
  role!: 'owner'|'admin'|'viewer';
}

@ApiTags('Client - Users')
@ApiBearerAuth('ClientBearer')
@Controller('client/users')
export class ClientUsersController {
  constructor(private readonly tenants: TenantsService, private readonly email: EmailService) {}

  @Get()
  @ApiOperation({ summary: 'List tenant users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @UseGuards(ClientAuthGuard)
  async listUsers(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    const tenantId = (req as any).tenantId as string;
    const p = Math.max(1, parseInt(page || '1', 10));
    const l = Math.max(1, Math.min(100, parseInt(limit || '20', 10)));
    const users = await this.tenants.listUsers(tenantId, p, l);
    return { page: p, limit: l, users };
  }

  @Post()
  @ApiOperation({ summary: 'Create tenant user (invite)' })
  @UseGuards(ClientAuthGuard)
  async createUser(@Req() req: Request, @Body() body: CreateUserDto) {
    const tenantId = (req as any).tenantId as string;
    const role = body.role ?? 'viewer';
    const email = body.email.toLowerCase().trim();
    const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const passwordHash = (this.tenants as any).hashPassword ? (this.tenants as any).hashPassword(password) : password; // fallback
    const created = await this.tenants.createUser(tenantId, email, passwordHash, role);
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const tenant = await this.tenants.getTenantById(tenantId);
    await this.tenants.setVerifyToken(tenantId, email, token);
    await this.email.sendClientVerifyEmail(tenant?.code ?? '', email, token);
    return { id: created?._id?.toString?.(), email, role, invited: true };
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update tenant user role' })
  @UseGuards(ClientAuthGuard)
  async updateUserRole(@Req() req: Request, @Param('userId') userId: string, @Body() body: UpdateUserDto) {
    const tenantId = (req as any).tenantId as string;
    const role = body.role;
    const { userModel }: any = (this.tenants as any);
    await userModel.updateOne({ _id: userId, tenantId }, { role }).exec();
    return { updated: true };
  }

  @Post('invite/:email')
  @ApiOperation({ summary: 'Resend invite to user' })
  @UseGuards(ClientAuthGuard)
  async resendInvite(@Req() req: Request, @Param('email') emailParam: string) {
    const tenantId = (req as any).tenantId as string;
    const email = emailParam.toLowerCase().trim();
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const tenant = await this.tenants.getTenantById(tenantId);
    await this.tenants.setVerifyToken(tenantId, email, token);
    await this.email.sendClientVerifyEmail(tenant?.code ?? '', email, token);
    return { invited: true };
  }
}