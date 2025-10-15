import { Injectable, NestMiddleware } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantRateLimitMiddleware implements NestMiddleware {
    private limiter = rateLimit({
        windowMs: 60 * 1000,           // 1 minuto
        max: 300,                      // 300 req/min por tenant (ajuste depois por plano)
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many requests', statusCode: 429 },
        keyGenerator: (req: Request): string => {
            // prioriza tenant; fallback para IP (caso rotas públicas)
            const headerName = (process.env.TENANT_HEADER || 'x-tenant-id').toLowerCase();
            const tenant = (req.headers[headerName] as string) || '';
            return tenant || (req.ip || 'anon');
        },
        skip: (req: Request) => {
            const url = req.originalUrl || req.url || '';
            // não aplica rate limit em docs/health
            return url.startsWith('/v1/health') || url.startsWith('/v1/docs') || url.startsWith('/v1/docs-json');
        },
    });

    use(req: Request, res: Response, next: NextFunction) {
        this.limiter(req, res, next);
    }
}
