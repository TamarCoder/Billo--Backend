import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { AppModule } from './app.module.js';
import { ensureAdmin } from './auth/ensure-admin.js';
import { Organization } from './organizations/entities/organization.entity.js';
import { UniqueViolationFilter } from './database/unique-violation.filter.js';

// Origins allowed to call this API.
// Billo frontend: Vite dev server and the Electron app (app://-).
const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Billo admin panel (Vite dev server).
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'app://-',
];

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind a proxy (Render), the real client IP is needed for the login limit.
  const rawTrustProxy = process.env.TRUST_PROXY?.trim().toLowerCase() ?? '';
  const trustProxy = rawTrustProxy === 'true' ? 1 : Number(rawTrustProxy || 0);
  if (trustProxy > 0) app.set('trust proxy', trustProxy);

  app.useGlobalFilters(new UniqueViolationFilter(app.get(HttpAdapterHost).httpAdapter));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origins = new Set(
    process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
      : DEFAULT_ORIGINS,
  );
  origins.add('app://-');
  origins.add('https://billo-admin.vercel.app');
  app.enableCors({ origin: [...origins], credentials: true });

  app.enableShutdownHooks();

  // Hosts without a shell (Render free plan): set ADMIN_EMAIL + ADMIN_PASSWORD, deploy, then remove them.
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const repo = app.get<Repository<Organization>>(getRepositoryToken(Organization));
    const code = process.env.ADMIN_IDENTIFICATION_CODE?.trim() || 'admin';
    const result = await ensureAdmin(repo, adminEmail, adminPassword, code);
    console.log(`Admin account ${result}.`);
  }

  // Port 3000 is used by the Next.js frontend, so the API uses 4000.
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
