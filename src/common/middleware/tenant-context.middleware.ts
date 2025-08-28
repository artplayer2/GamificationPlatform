import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const url = req.originalUrl || req.url || '';

        const publicPrefixes = [
            '/v1/health',
            '/v1/docs',        // UI do Swagger
            '/v1/docs-json',   // JSON do Swagger
        ];

        if (publicPrefixes.some(prefix => url.startsWith(prefix))) {
            return next();
        }

        const headerName = (process.env.TENANT_HEADER || 'x-tenant-id').toLowerCase();
        const tenantId = (req.headers[headerName] as string) || '';

        if (!tenantId) {
            throw new UnauthorizedException(`Missing tenant header: ${headerName}`);
        }

        (req as any).tenantId = tenantId;
        next();
    }
}
