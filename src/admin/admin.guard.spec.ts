import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';

function contextWith(role?: 'admin' | 'organization'): ExecutionContext {
  const request = {
    organization: role
      ? { id: '1', identificationCode: '123456789', email: 'a@b.ge', role }
      : undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('lets an admin through', () => {
    expect(guard.canActivate(contextWith('admin'))).toBe(true);
  });

  it('blocks a normal organization with 403', () => {
    expect(() => guard.canActivate(contextWith('organization'))).toThrow(
      ForbiddenException,
    );
  });

  it('blocks a request without an organization', () => {
    expect(() => guard.canActivate(contextWith())).toThrow(ForbiddenException);
  });
});
