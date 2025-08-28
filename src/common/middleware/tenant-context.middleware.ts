import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerName = (process.env.TENANT_HEADER || 'x-tenant-id').toLowerCase();
    const tenantId = (req.headers[headerName] as string) || '';
    if (!tenantId) {
      throw new UnauthorizedException(`Missing tenant header: ${headerName}`);
    }
    (req as any).tenantId = tenantId;
    next();
  }
}
