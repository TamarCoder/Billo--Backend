import { databaseDataSource } from './data-source.js';

try {
  await databaseDataSource.initialize();
  const migrations = await databaseDataSource.runMigrations();
  if (migrations.length === 0) {
    console.log('Database is up to date; no migrations were applied.');
  } else {
    for (const migration of migrations) {
      console.log(`Applied migration: ${migration.name}`);
    }
  }
} finally {
  if (databaseDataSource.isInitialized) {
    await databaseDataSource.destroy();
  }
}
