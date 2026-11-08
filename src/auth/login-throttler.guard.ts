import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

// Counts login attempts per identification code + IP, so one attacker cannot
// guess a password and one busy office IP does not lock out other organizations.
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: Request): Promise<string> {
    const body = request.body as { identificationCode?: unknown } | undefined;
    const code = typeof body?.identificationCode === 'string' ? body.identificationCode.trim() : '';
    return Promise.resolve(`${code}|${request.ip ?? ''}`);
  }
}
