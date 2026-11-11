import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organizations/entities/organization.entity.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { Session } from './entities/session.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Session]),
    // Per 15 minutes: 5 attempts per code+IP, and 30 per IP across all codes (stops one
    // password being tried on many codes). Counters live in memory and reset on restart.
    ThrottlerModule.forRoot([
      { name: 'login', ttl: 15 * 60_000, limit: 5 },
      {
        name: 'loginIp',
        ttl: 15 * 60_000,
        limit: 30,
        getTracker: (request: Record<string, unknown>) =>
          typeof request.ip === 'string' ? request.ip : '',
      },
    ]),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
