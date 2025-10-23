import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitRedisService } from '../../modules/rate-limit/rate-limit.service';
import { TenantsService } from '../../modules/tenants/tenants.service';
import { PlansService } from '../../modules/plans/plans.service';

@Injectable()
export class TenantRateLimitMiddleware implements NestMiddleware {
    constructor(
        private readonly rateLimit: RateLimitRedisService,
        private readonly tenants: TenantsService,
        private readonly plans: PlansService,
    ) {}

    private shouldSkip(req: Request): boolean {
        const url = req.originalUrl || req.url || '';
        return url.startsWith('/v1/health') || url.startsWith('/v1/docs') || url.startsWith('/v1/docs-json');
    }

    private headerOf(req: Request, name: string): string | undefined {
        return (req.headers[name.toLowerCase()] as string | undefined) ?? undefined;
    }

    private tenantOrIp(req: Request): string {
        const headerName = (process.env.TENANT_HEADER || 'x-tenant-id').toLowerCase();
        const tenant = this.headerOf(req, headerName);
        const ip = req.ip || 'anon';
        return tenant || ip;
    }

    private async getLimitForTenant(tenantOrIp: string): Promise<number> {
        const base = Number(process.env.TENANT_RPS_DEFAULT || 300);
        // If it looks like a tenant code, try plan limits
        if (tenantOrIp && !tenantOrIp.match(/^[0-9a-fA-F:\.]+$/)) {
            const tenant = await this.tenants.getTenantByCode(tenantOrIp).catch(() => null);
            if (tenant?.plan) {
                const plan = await this.plans.getByCode(tenant.plan).catch(() => null);
                if (plan?.limits?.restMaxReqPerMin) return plan.limits.restMaxReqPerMin;
            }
        }
        if (!Number.isFinite(base) || base <= 0) return 300;
        return base;
    }

    async use(req: Request, res: Response, next: NextFunction) {
        if (this.shouldSkip(req)) return next();

        const tenantOrIp = this.tenantOrIp(req);
        const limit = await this.getLimitForTenant(tenantOrIp);
        const bucketKey = `tenant:${tenantOrIp}`;

        const result = await this.rateLimit.checkPerMinute(bucketKey, limit);
        if (!result.allowed) {
            res.status(429).json({ message: 'Too many requests', statusCode: 429 });
            return;
        }

        next();
    }
}
