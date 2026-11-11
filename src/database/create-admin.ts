import { hashPassword } from '../auth/password.js';
import { Organization } from '../organizations/entities/organization.entity.js';
import { databaseDataSource } from './data-source.js';

// Creates the admin account from ADMIN_EMAIL + ADMIN_PASSWORD, or resets its password. Safe to re-run.
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
// identification_code is required and unique; admins never use it to sign in.
const code = process.env.ADMIN_IDENTIFICATION_CODE?.trim() || 'admin';

if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD.');
if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.');

try {
  await databaseDataSource.initialize();
  const repo = databaseDataSource.getRepository(Organization);
  const passwordHash = await hashPassword(password);
  const existing = await repo.findOne({ where: { email }, select: { id: true } });
  if (existing) {
    await repo.update(existing.id, { passwordHash, role: 'admin' });
    console.log(`Admin ${email} updated.`);
  } else if (await repo.exists({ where: { identificationCode: code } })) {
    console.error(`Identification code ${code} is taken; set ADMIN_IDENTIFICATION_CODE.`);
    process.exitCode = 1;
  } else {
    await repo.save(repo.create({ identificationCode: code, email, passwordHash, role: 'admin' }));
    console.log(`Admin ${email} created.`);
  }
} finally {
  if (databaseDataSource.isInitialized) await databaseDataSource.destroy();
}
