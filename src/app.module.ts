import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { LegacyImportModule } from './legacy-import/legacy-import.module.js';

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
        ],
        synchronize: false,
      }),
    }),
    CompaniesModule,
    InvoicesModule,
    SettingsModule,
    LegacyImportModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
