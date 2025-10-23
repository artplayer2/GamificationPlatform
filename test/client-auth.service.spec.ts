import { describe, it, expect, beforeAll } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ClientAuthService, ClientTokenPayload } from '../src/modules/client-auth/client-auth.service';

describe('ClientAuthService', () => {
  let service: ClientAuthService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } })],
      providers: [ClientAuthService],
    }).compile();
    service = moduleRef.get(ClientAuthService);
  });

  it('signs and verifies token', () => {
    const payload: ClientTokenPayload = {
      sub: 'u1',
      tenantId: 't1',
      email: 'owner@demo.com',
      role: 'owner',
      scopes: ['read:metrics'],
    };
    const token = service.signToken(payload);
    expect(typeof token).toBe('string');
    const decoded = service.verifyToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.tenantId).toBe(payload.tenantId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(Array.isArray(decoded.scopes)).toBe(true);
  });

  it('hashes and verifies password', () => {
    const hash = service.hashPassword('Str0ngP@ss!');
    expect(hash).toMatch(/^pbkdf2_sha256\$/);
    expect(service.verifyPassword('Str0ngP@ss!', hash)).toBe(true);
    expect(service.verifyPassword('wrong', hash)).toBe(false);
  });
});