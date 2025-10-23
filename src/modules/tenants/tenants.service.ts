import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { TenantUser, TenantUserDocument } from './schemas/tenant-user.schema';
import * as crypto from 'crypto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(TenantUser.name) private readonly userModel: Model<TenantUserDocument>,
  ) {}

  async createTenant(code: string, name: string, plan: string = 'free'): Promise<Tenant> {
    const exists = await this.tenantModel.exists({ code });
    if (exists) throw new ConflictException('Tenant code already exists');
    return this.tenantModel.create({ code, name, plan });
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return this.tenantModel.findById(id).lean();
  }

  async getTenantByCode(code: string): Promise<Tenant | null> {
    return this.tenantModel.findOne({ code }).lean();
  }

  async createOwnerUser(tenantId: string, email: string, passwordHash: string): Promise<TenantUser> {
    const exists = await this.userModel.exists({ tenantId, email });
    if (exists) throw new ConflictException('Email already in use for tenant');
    return this.userModel.create({ tenantId, email, passwordHash, role: 'owner' });
  }

  async createUser(tenantId: string, email: string, passwordHash: string, role: 'owner'|'admin'|'viewer' = 'viewer'): Promise<TenantUser> {
    const exists = await this.userModel.exists({ tenantId, email });
    if (exists) throw new ConflictException('Email already in use for tenant');
    return this.userModel.create({ tenantId, email, passwordHash, role });
  }

  async listUsers(tenantId: string, page = 1, limit = 20): Promise<{users: TenantUser[], total: number}> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find({ tenantId }).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments({ tenantId }),
    ]);
    return { users, total };
  }

  async setVerifyToken(tenantId: string, email: string, token: string, ttlMinutes = 60): Promise<void> {
    const verifyTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const verifyTokenExpiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    const res = await this.userModel.updateOne({ tenantId, email }, { verifyTokenHash, verifyTokenExpiresAt });
    if (res.matchedCount === 0) throw new NotFoundException('User not found');
  }

  async verifyEmail(tenantId: string, email: string, token: string): Promise<void> {
    const verifyTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userModel.findOne({ tenantId, email }).lean();
    if (!user) throw new NotFoundException('User not found');
    if (!user.verifyTokenHash || !user.verifyTokenExpiresAt || user.verifyTokenExpiresAt.getTime() < Date.now()) {
      throw new ConflictException('Verification token invalid or expired');
    }
    if (user.verifyTokenHash !== verifyTokenHash) throw new ConflictException('Verification token mismatch');
    await this.userModel.updateOne({ tenantId, email }, { verifiedAt: new Date(), verifyTokenHash: null, verifyTokenExpiresAt: null });
  }

  async setResetToken(tenantId: string, email: string, token: string, ttlMinutes = 60): Promise<void> {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetTokenExpiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    const res = await this.userModel.updateOne({ tenantId, email }, { resetTokenHash, resetTokenExpiresAt });
    if (res.matchedCount === 0) throw new NotFoundException('User not found');
  }

  async resetPassword(tenantId: string, email: string, token: string, newPasswordHash: string): Promise<void> {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userModel.findOne({ tenantId, email }).lean();
    if (!user) throw new NotFoundException('User not found');
    if (!user.resetTokenHash || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
      throw new ConflictException('Reset token invalid or expired');
    }
    if (user.resetTokenHash !== resetTokenHash) throw new ConflictException('Reset token mismatch');
    await this.userModel.updateOne({ tenantId, email }, { passwordHash: newPasswordHash, resetTokenHash: null, resetTokenExpiresAt: null });
  }
}