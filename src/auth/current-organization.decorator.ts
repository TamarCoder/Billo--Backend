import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './session.guard.js';

// The organization that SessionGuard attached to the request.
export const CurrentOrganization = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthedRequest>().organization,
);
