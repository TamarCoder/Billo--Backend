import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './health/health.controller.js';
import { CompaniesModule } from './companies/companies.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { AuthModule } from './auth/auth.module.js';
import { IssuersModule } from './issuers/issuers.module.js';
import { SessionGuard } from './auth/session.guard.js';

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
