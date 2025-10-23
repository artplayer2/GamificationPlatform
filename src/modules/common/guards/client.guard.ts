import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ClientAuthGuard implements CanActivate {
  private readonly jwt: JwtService;
  constructor() {
    this.jwt = new JwtService({ secret: process.env.CLIENT_JWT_SECRET ?? 'dev-client-secret' });
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const token = auth.slice('Bearer '.length);
    try {
      const decoded = this.jwt.verify<any>(token);
      (req as any).tenantId = decoded.tenantId;
      (req as any).clientUser = { id: decoded.sub, email: decoded.email, role: decoded.role, scopes: decoded.scopes };
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}