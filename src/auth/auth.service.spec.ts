import { UnauthorizedException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Organization } from '../organizations/entities/organization.entity.js';
import type { Session } from './entities/session.entity.js';
import { AuthService } from './auth.service.js';
import { hashPassword } from './password.js';

describe('AuthService.adminLogin', () => {
  let organizations: { findOne: ReturnType<typeof vi.fn> };
  let sessions: Record<string, ReturnType<typeof vi.fn>>;
  let service: AuthService;

  async function account(role: 'admin' | 'organization') {
    return {
      id: 'org-1',
      identificationCode: 'admin',
      email: 'admin@billo.ge',
      role,
      passwordHash: await hashPassword('correct-pass'),
    };
  }

  beforeEach(() => {
    organizations = { findOne: vi.fn() };
    sessions = {
      delete: vi.fn().mockResolvedValue(undefined),
      create: vi.fn((value: unknown) => value),
      save: vi.fn().mockResolvedValue(undefined),
    };
    service = new AuthService(
      organizations as unknown as Repository<Organization>,
      sessions as unknown as Repository<Session>,
    );
  });

  it('signs in an admin by email', async () => {
    organizations.findOne.mockResolvedValue(await account('admin'));
    const result = await service.adminLogin({ email: 'admin@billo.ge', password: 'correct-pass' });
    expect(result.organization.role).toBe('admin');
    expect(result.token).toEqual(expect.any(String));
    expect(organizations.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'admin@billo.ge' } }),
    );
  });

  it('rejects a regular organization with the right password', async () => {
    organizations.findOne.mockResolvedValue(await account('organization'));
    await expect(
      service.adminLogin({ email: 'admin@billo.ge', password: 'correct-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.save).not.toHaveBeenCalled();
  });

  it('rejects a wrong password and an unknown email', async () => {
    organizations.findOne.mockResolvedValue(await account('admin'));
    await expect(
      service.adminLogin({ email: 'admin@billo.ge', password: 'wrong-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    organizations.findOne.mockResolvedValue(null);
    await expect(
      service.adminLogin({ email: 'nobody@billo.ge', password: 'correct-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
