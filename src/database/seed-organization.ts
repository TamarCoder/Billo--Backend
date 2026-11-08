import { hashPassword } from '../auth/password.js';
import { Organization } from '../organizations/entities/organization.entity.js';
import { databaseDataSource } from './data-source.js';

const LOCKED_PASSWORD = '!';

// Creates one organization from SEED_ORG_* env values. Safe to re-run.
const code = process.env.SEED_ORG_IDENTIFICATION_CODE?.trim();
const email = process.env.SEED_ORG_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_ORG_PASSWORD;

if (!code || !email || !password) {
  throw new Error('Set SEED_ORG_IDENTIFICATION_CODE, SEED_ORG_EMAIL and SEED_ORG_PASSWORD.');
}

try {
  await databaseDataSource.initialize();
  const repo = databaseDataSource.getRepository(Organization);
  const existing = await repo.findOne({
    where: { identificationCode: code },
    select: { id: true, passwordHash: true },
  });
  const emailOwner = await repo.findOne({ where: { email }, select: { id: true } });
  if (emailOwner && emailOwner.id !== existing?.id) {
    console.error(`Email ${email} already belongs to another organization; nothing changed.`);
    process.exitCode = 1;
  } else if (existing?.passwordHash === LOCKED_PASSWORD) {
    // Created by the data migration without a password: set the real one now.
    await repo.update(existing.id, { email, passwordHash: await hashPassword(password) });
    console.log(`Organization ${code} password set.`);
  } else if (existing || (await repo.exists({ where: { email } }))) {
    console.log(`Organization ${code} already exists; nothing changed.`);
  } else {
    await repo.save(
      repo.create({ identificationCode: code, email, passwordHash: await hashPassword(password) }),
    );
    console.log(`Organization ${code} created.`);
  }
} finally {
  if (databaseDataSource.isInitialized) await databaseDataSource.destroy();
}
