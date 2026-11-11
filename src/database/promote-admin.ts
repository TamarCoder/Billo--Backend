import { Organization } from '../organizations/entities/organization.entity.js';
import { databaseDataSource } from './data-source.js';

// Gives an existing organization the admin role. Safe to re-run.
const code = process.env.ADMIN_IDENTIFICATION_CODE?.trim();
if (!code) throw new Error('Set ADMIN_IDENTIFICATION_CODE.');

try {
  await databaseDataSource.initialize();
  const result = await databaseDataSource
    .getRepository(Organization)
    .update({ identificationCode: code }, { role: 'admin' });
  if (result.affected) {
    console.log(`Organization ${code} is now an admin.`);
  } else {
    console.error(`No organization with code ${code}; register it first.`);
    process.exitCode = 1;
  }
} finally {
  if (databaseDataSource.isInitialized) await databaseDataSource.destroy();
}
