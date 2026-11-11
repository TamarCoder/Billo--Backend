import { ensureAdmin } from '../auth/ensure-admin.js';
import { Organization } from '../organizations/entities/organization.entity.js';
import { databaseDataSource } from './data-source.js';

// Creates the admin account from ADMIN_EMAIL + ADMIN_PASSWORD, or resets its password. Safe to re-run.
const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;
const code = process.env.ADMIN_IDENTIFICATION_CODE?.trim() || 'admin';
if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD.');

try {
  await databaseDataSource.initialize();
  const result = await ensureAdmin(databaseDataSource.getRepository(Organization), email, password, code);
  if (result === 'code-taken') {
    console.error(`Identification code ${code} is taken; set ADMIN_IDENTIFICATION_CODE.`);
    process.exitCode = 1;
  } else {
    console.log(`Admin ${email.toLowerCase()} ${result}.`);
  }
} finally {
  if (databaseDataSource.isInitialized) await databaseDataSource.destroy();
}
