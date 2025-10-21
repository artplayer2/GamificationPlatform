import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';

export type PlayerTokenPayload = {
  sub: string; // playerId
  tenantId: string;
  projectId: string;
  username: string;
  roles: string[]; // ["player"]
  scopes: string[]; // e.g. ["player:read"]
};

@Injectable()
export class PlayerAuthService {
  constructor(private readonly jwt: JwtService) {}

  signToken(payload: PlayerTokenPayload) {
    const token = this.jwt.sign(payload);
    return token;
  }

  verifyToken(token: string): PlayerTokenPayload {
    const decoded = this.jwt.verify<PlayerTokenPayload>(token);
    return decoded;
  }

  // ===== Password hashing (PBKDF2) =====
  hashPassword(plaintext: string): string {
    if (!plaintext || plaintext.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    const algo = 'pbkdf2_sha256';
    const iterations = 150000; // balance security/perf
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(plaintext, salt, iterations, 32, 'sha256').toString('hex');
    return `${algo}$${iterations}$${salt}$${hash}`;
  }

  verifyPassword(plaintext: string, stored: string): boolean {
    try {
      const [algo, itStr, salt, expected] = (stored || '').split('$');
      if (algo !== 'pbkdf2_sha256') return false;
      const iterations = parseInt(itStr, 10);
      if (!iterations || !salt || !expected) return false;
      const computed = pbkdf2Sync(plaintext, salt, iterations, 32, 'sha256').toString('hex');
      const a = Buffer.from(computed, 'hex');
      const b = Buffer.from(expected, 'hex');
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}