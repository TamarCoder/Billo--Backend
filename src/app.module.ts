import { DropLegacyDataImports1735000000000 } from './database/migrations/1735000000000-drop-legacy-data-imports.js';
import { RenameInsuranceCompanies1734000000000 } from './database/migrations/1734000000000-rename-insurance-companies.js';
import { AllowMultipleIssuers1733000000000 } from './database/migrations/1733000000000-allow-multiple-issuers.js';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './health/health.controller.js';
import { CompaniesModule } from './companies/companies.module.js';
import { CreateInsuranceCompanies1710000000000 } from './database/migrations/1710000000000-create-insurance-companies.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { CreateInvoicesAndSettings1710000000001 } from './database/migrations/1710000000001-create-invoices-and-settings.js';
import { AuthModule } from './auth/auth.module.js';
import { IssuersModule } from './issuers/issuers.module.js';
import { SessionGuard } from './auth/session.guard.js';
import { ScopeDataToOrganizations1732000000000 } from './database/migrations/1732000000000-scope-data-to-organizations.js';
import { CreateOrganizationsAndSessions1731000000000 } from './database/migrations/1731000000000-create-organizations-and-sessions.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<string>('DB_PORT')),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        // Neon (production) requires SSL; local Docker Postgres does not.
        ssl: config.get<string>('DB_SSL') === 'true',
        autoLoadEntities: true,
        migrations: [
          CreateInsuranceCompanies1710000000000,
          CreateInvoicesAndSettings1710000000001,
          CreateOrganizationsAndSessions1731000000000,
          ScopeDataToOrganizations1732000000000,
          AllowMultipleIssuers1733000000000,
          RenameInsuranceCompanies1734000000000,
          DropLegacyDataImports1735000000000,
        ],
        synchronize: false,
      }),
    }),
    CompaniesModule,
    InvoicesModule,
    SettingsModule,
    AuthModule,
    IssuersModule,
  ],
  controllers: [AppController, HealthController],
  // Every route needs a login session unless marked @Public().
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule {}
