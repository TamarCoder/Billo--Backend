import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService, type OrganizationView } from './auth.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export interface AuthedRequest extends Request {
  organization?: OrganizationView;
  sessionToken?: string;
}

export function readBearer(request: Request): string | null {
  const header = request.header('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

// Every non-public route needs "Authorization: Bearer <session token>".
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = readBearer(request);
    const organization = token ? await this.auth.findOrganizationByToken(token) : null;
    if (!token || !organization) throw new UnauthorizedException('Session expired');

    request.organization = organization;
    request.sessionToken = token;
    return true;
  }
}
