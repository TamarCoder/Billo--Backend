import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthedRequest } from '../auth/session.guard.js';

// Runs after the global SessionGuard, so request.organization is already set.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    if (request.organization?.role !== 'admin')
      throw new ForbiddenException('Admins only');
    return true;
  }
}
