import type { Repository } from 'typeorm';
import type { Organization } from '../organizations/entities/organization.entity.js';
import { hashPassword } from './password.js';

export type EnsureAdminResult = 'created' | 'updated' | 'code-taken';

// Creates the admin account, or resets its password and role. Safe to re-run.
// identification_code is required and unique; admins never use it to sign in.
export async function ensureAdmin(
  repo: Repository<Organization>,
  email: string,
  password: string,
  code = 'admin',
): Promise<EnsureAdminResult> {
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  const normalized = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const existing = await repo.findOne({ where: { email: normalized }, select: { id: true } });
  if (existing) {
    await repo.update(existing.id, { passwordHash, role: 'admin' });
    return 'updated';
  }
  if (await repo.exists({ where: { identificationCode: code } })) return 'code-taken';
  await repo.save(repo.create({ identificationCode: code, email: normalized, passwordHash, role: 'admin' }));
  return 'created';
}
