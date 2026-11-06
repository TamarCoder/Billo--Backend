import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export const API_KEY_HEADER = 'x-api-key';

// Every request must send the X-API-Key header that matches API_KEY.
// Locally API_KEY may be left empty (API stays open for development).
// On Render (RENDER is set automatically) a missing API_KEY blocks everything.
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly expectedKey: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    this.expectedKey = config.get<string>('API_KEY')?.trim() ?? '';
    this.isProduction = Boolean(config.get<string>('RENDER'));

    if (!this.expectedKey) {
      if (this.isProduction) {
        this.logger.error('API_KEY is not set: all API requests are rejected.');
      } else {
        this.logger.warn('API_KEY is not set: API is open (local development).');
      }
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!this.expectedKey) {
      if (this.isProduction) {
        throw new UnauthorizedException('Server API key is not configured');
      }
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header(API_KEY_HEADER) ?? '';
    if (!keysMatch(providedKey, this.expectedKey)) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}

function keysMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
