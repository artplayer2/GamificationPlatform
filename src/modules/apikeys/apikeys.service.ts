import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument } from './schemas/apikey.schema';
import { CreateApiKeyDto } from './dto/create-apikey.dto';
import { UpdateApiKeyDto } from './dto/update-apikey.dto';
import { TenantProjectValidator } from '../common/tenant-project.validator';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKeyDocument>,
    private readonly tenantProjectValidator: TenantProjectValidator,
  ) {}

  private generateKeyString(): string {
    const raw = randomBytes(32).toString('base64url');
    return `gmk_${raw}`; // gamification key
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async create(tenantId: string, dto: CreateApiKeyDto) {
    await this.tenantProjectValidator.ensureOptionalProject(tenantId, dto.projectId);

    const plaintext = this.generateKeyString();
    const prefix = plaintext.slice(0, 12);
    const hash = this.hashKey(plaintext);

    const doc = await this.apiKeyModel.create({
      tenantId,
      projectId: dto.projectId ?? null,
      name: dto.name,
      prefix,
      hash,
      roles: dto.roles ?? ['owner'],
      scopes: dto.scopes ?? ['read:*', 'write:events'],
      active: true,
      revokedAt: null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      rateLimitPerMin: dto.rateLimitPerMin ?? 600,
    });

    return {
      id: doc._id.toString(),
      name: doc.name,
      tenantId: doc.tenantId,
      projectId: doc.projectId,
      roles: doc.roles,
      scopes: doc.scopes,
      active: doc.active,
      expiresAt: doc.expiresAt,
      rateLimitPerMin: doc.rateLimitPerMin,
      prefix: doc.prefix,
      plaintextKey: plaintext, // only returned once
      createdAt: (doc as any).createdAt,
    };
  }

  async list(tenantId: string, projectId?: string) {
    const filter: any = { tenantId };
    if (projectId) filter.projectId = projectId;
    const list = await this.apiKeyModel.find(filter).lean().exec();
    return list.map(k => ({
      id: k._id.toString(),
      name: k.name,
      tenantId: k.tenantId,
      projectId: k.projectId ?? null,
      roles: k.roles,
      scopes: k.scopes,
      active: k.active,
      expiresAt: k.expiresAt ?? null,
      rateLimitPerMin: k.rateLimitPerMin,
      prefix: k.prefix,
      lastUsedAt: k.lastUsedAt ?? null,
      usageCount: k.usageCount ?? 0,
      createdAt: (k as any).createdAt,
      updatedAt: (k as any).updatedAt,
    }));
  }

  async update(tenantId: string, id: string, dto: UpdateApiKeyDto) {
    const doc = await this.apiKeyModel.findOne({ _id: id, tenantId }).exec();
    if (!doc) throw new NotFoundException('API Key not found');

    if (dto.name !== undefined) doc.name = dto.name;
    if (dto.roles !== undefined) doc.roles = dto.roles;
    if (dto.scopes !== undefined) doc.scopes = dto.scopes;
    if (dto.expiresAt !== undefined) doc.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.rateLimitPerMin !== undefined) doc.rateLimitPerMin = dto.rateLimitPerMin;

    await doc.save();
    return { ok: true };
  }

  async revoke(tenantId: string, id: string) {
    const doc = await this.apiKeyModel.findOne({ _id: id, tenantId }).exec();
    if (!doc) throw new NotFoundException('API Key not found');
    doc.active = false;
    doc.revokedAt = new Date();
    await doc.save();
    return { ok: true };
  }

  async rotate(tenantId: string, id: string) {
    const doc = await this.apiKeyModel.findOne({ _id: id, tenantId }).exec();
    if (!doc) throw new NotFoundException('API Key not found');
    if (doc.revokedAt) throw new BadRequestException('Cannot rotate a revoked key');
    const plaintext = this.generateKeyString();
    doc.prefix = plaintext.slice(0, 12);
    doc.hash = this.hashKey(plaintext);
    doc.active = true;
    await doc.save();
    return { ok: true, plaintextKey: plaintext, prefix: doc.prefix };
  }

  async verify(tenantId: string, projectId: string, plaintextKey: string) {
    const hash = this.hashKey(plaintextKey);
    const now = new Date();
    const doc = await this.apiKeyModel.findOne({
      tenantId,
      hash,
      active: true,
      $or: [ { projectId }, { projectId: null }, { projectId: undefined } ],
    }).exec();
    if (!doc) return null;
    if (doc.expiresAt && doc.expiresAt < now) return null;
    // update usage stats (non-blocking)
    try {
      doc.lastUsedAt = now;
      doc.usageCount = (doc.usageCount || 0) + 1;
      await doc.save();
    } catch {}
    return doc;
  }
}