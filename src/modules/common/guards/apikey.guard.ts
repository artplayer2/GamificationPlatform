import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../../apikeys/apikeys.service';

type Bucket = { windowStart: number; count: number; limit: number };

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private buckets = new Map<string, Bucket>();

  constructor(private readonly apiKeys: ApiKeysService) {}

  private headerOf(req: Request, name: string): string | undefined {
    return (req.headers[name.toLowerCase()] as string | undefined) ?? undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const tenantId = (req as any).tenantId as string | undefined;
    const apiKey = this.headerOf(req, 'x-api-key') || (req.query['x-api-key'] as string | undefined);
    const projectId = this.headerOf(req, 'x-project-id')
      || (req.query['x-project-id'] as string | undefined)
      || (req.body?.projectId as string | undefined)
      || (req.params?.projectId as string | undefined);

    if (!tenantId) throw new UnauthorizedException('Missing tenantId');
    if (!apiKey) throw new UnauthorizedException('Missing x-api-key');
    if (!projectId) throw new UnauthorizedException('Missing x-project-id');

    const doc = await this.apiKeys.verify(tenantId, projectId, apiKey);
    if (!doc) throw new UnauthorizedException('Invalid or expired API key');

    // simple global per-key rate-limit
    const key = doc._id.toString();
    const now = Date.now();
    const minute = 60_000;
    const bucket = this.buckets.get(key) || { windowStart: now, count: 0, limit: doc.rateLimitPerMin || 600 };
    if (now - bucket.windowStart >= minute) {
      bucket.windowStart = now;
      bucket.count = 0;
      bucket.limit = doc.rateLimitPerMin || 600;
    }
    bucket.count += 1;
    this.buckets.set(key, bucket);
    if (bucket.count > bucket.limit) {
      throw new HttpException('API key rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    // attach context
    (req as any).apiKey = {
      id: doc._id.toString(),
      tenantId: doc.tenantId,
      projectId: doc.projectId ?? null,
      roles: doc.roles ?? [],
      scopes: doc.scopes ?? [],
      prefix: doc.prefix,
    };
    return true;
  }
}