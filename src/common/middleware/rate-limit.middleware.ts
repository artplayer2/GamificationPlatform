import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type Bucket = { windowStart: number; count: number; limit: number };

@Injectable()
export class TenantRateLimitMiddleware implements NestMiddleware {
    private buckets = new Map<string, Bucket>();

    private shouldSkip(req: Request): boolean {
        const url = req.originalUrl || req.url || '';
        return url.startsWith('/v1/health') || url.startsWith('/v1/docs') || url.startsWith('/v1/docs-json');
    }

    private headerOf(req: Request, name: string): string | undefined {
        return (req.headers[name.toLowerCase()] as string | undefined) ?? undefined;
    }

    private tenantKey(req: Request): string {
        const headerName = (process.env.TENANT_HEADER || 'x-tenant-id').toLowerCase();
        const tenant = this.headerOf(req, headerName);
        const ip = req.ip || 'anon';
        return tenant || ip;
    }

    private getLimitForTenant(_tenantIdOrIp: string): number {
        const base = Number(process.env.TENANT_RPS_DEFAULT || 300);
        if (!Number.isFinite(base) || base <= 0) return 300;
        return base;
    }

    use(req: Request, res: Response, next: NextFunction) {
        if (this.shouldSkip(req)) return next();

        const key = this.tenantKey(req);
        const limit = this.getLimitForTenant(key);
        const now = Date.now();
        const minute = 60_000;

        const bucket = this.buckets.get(key) || { windowStart: now, count: 0, limit };
        if (now - bucket.windowStart >= minute) {
            bucket.windowStart = now;
            bucket.count = 0;
            bucket.limit = limit;
        }
        bucket.count += 1;
        this.buckets.set(key, bucket);

        if (bucket.count > bucket.limit) {
            res.status(429).json({ message: 'Too many requests', statusCode: 429 });
            return;
        }

        next();
    }
}
