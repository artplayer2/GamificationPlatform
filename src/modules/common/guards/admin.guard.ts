import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../../apikeys/apikeys.service';
import { RateLimitRedisService } from '../../rate-limit/rate-limit.service';

@Injectable()
export class AdminApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeys: ApiKeysService,
    private readonly rateLimit: RateLimitRedisService,
  ) {}

  private headerOf(req: Request, name: string): string | undefined {
    return (req.headers[name.toLowerCase()] as string | undefined) ?? undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const tenantId = (req as any).tenantId as string | undefined;
    const apiKey = this.headerOf(req, 'x-api-key') || (req.query['x-api-key'] as string | undefined);

    if (!tenantId) throw new UnauthorizedException('Missing tenantId');
    if (!apiKey) throw new UnauthorizedException('Missing x-api-key');

    // Admin guard validates tenant-level keys (no projectId) with owner/admin role
    const doc = await this.apiKeys.verify(tenantId, '__tenant_admin__', apiKey);
    if (!doc) throw new UnauthorizedException('Invalid or expired API key');
    if (doc.projectId) throw new UnauthorizedException('Project-bound API key not allowed for admin routes');
    const roles = doc.roles ?? [];
    if (!roles.includes('owner') && !roles.includes('admin')) {
      throw new UnauthorizedException('API key lacks required admin role');
    }

    // per-key rate limit via Redis
    const bucketKey = `apikey:${doc._id.toString()}`;
    const limit = doc.rateLimitPerMin || 300;
    const result = await this.rateLimit.checkPerMinute(bucketKey, limit);
    if (!result.allowed) {
      throw new HttpException('API key rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    // attach context
    (req as any).adminApiKey = {
      id: doc._id.toString(),
      tenantId: doc.tenantId,
      roles: roles,
      scopes: doc.scopes ?? [],
      prefix: doc.prefix,
    };
    return true;
  }
}