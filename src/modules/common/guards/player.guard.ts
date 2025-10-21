import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PlayerAuthService } from '../../player-auth/player-auth.service';

@Injectable()
export class PlayerAuthGuard implements CanActivate {
  private buckets = new Map<string, { windowStart: number; count: number; limit: number }>();
  constructor(private readonly auth: PlayerAuthService) {}

  private bearerOf(req: Request): string | undefined {
    const header = (req.headers['authorization'] as string | undefined) ?? undefined;
    if (!header) return undefined;
    const [scheme, token] = header.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer') return undefined;
    return token;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.bearerOf(req);
    if (!token) throw new UnauthorizedException('Missing Bearer token');
    try {
      const payload = this.auth.verifyToken(token);
      (req as any).tenantId = payload.tenantId; // garante contexto
      (req as any).projectId = payload.projectId;
      (req as any).player = {
        id: payload.sub,
        username: payload.username,
        roles: payload.roles,
        scopes: payload.scopes,
      };
      // simple per-player rate limit (global)
      const key = payload.sub;
      const now = Date.now();
      const minute = 60_000;
      const defaultLimit = Number(process.env.PLAYER_RPS_DEFAULT || 300);
      const baseLimit = Number.isFinite(defaultLimit) && defaultLimit > 0 ? defaultLimit : 300;
      const bucket = this.buckets.get(key) || { windowStart: now, count: 0, limit: baseLimit };
      if (now - bucket.windowStart >= minute) {
        bucket.windowStart = now;
        bucket.count = 0;
        bucket.limit = baseLimit;
      }
      bucket.count += 1;
      this.buckets.set(key, bucket);
      if (bucket.count > bucket.limit) {
        throw new HttpException('Player token rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}