import { describe, it, expect } from '@jest/globals';
import { ClientAuthGuard } from '../src/modules/common/guards/client.guard';
import { JwtService } from '@nestjs/jwt';

function mockContextWithHeaders(headers: Record<string, string>) {
  const req = { headers } as any;
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as any;
}

describe('ClientAuthGuard', () => {
  const secret = process.env.CLIENT_JWT_SECRET ?? 'dev-client-secret';
  const jwt = new JwtService({ secret });

  it('allows valid token and attaches context', async () => {
    const token = jwt.sign({ sub: 'u1', tenantId: 't1', email: 'owner@demo.com', role: 'owner', scopes: ['read'] });
    const guard = new ClientAuthGuard();
    const ctx = mockContextWithHeaders({ authorization: `Bearer ${token}` });
    const ok = await guard.canActivate(ctx);
    expect(ok).toBe(true);
    const req: any = ctx.switchToHttp().getRequest();
    expect(req.tenantId).toBe('t1');
    expect(req.clientUser).toMatchObject({ id: 'u1', email: 'owner@demo.com', role: 'owner' });
    expect(Array.isArray(req.clientUser.scopes)).toBe(true);
  });

  it('throws on missing token', () => {
    const guard = new ClientAuthGuard();
    const ctx = mockContextWithHeaders({} as any);
    expect(() => guard.canActivate(ctx)).toThrow('Missing Bearer token');
  });

  it('throws on invalid token', () => {
    const guard = new ClientAuthGuard();
    const ctx = mockContextWithHeaders({ authorization: 'Bearer invalid' });
    expect(() => guard.canActivate(ctx)).toThrow('Invalid token');
  });
});