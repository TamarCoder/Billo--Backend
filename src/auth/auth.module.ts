import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organizations/entities/organization.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { Session } from './entities/session.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Session]),
    // 5 login attempts per 15 minutes; counters live in memory and reset on restart.
    ThrottlerModule.forRoot([{ name: 'login', ttl: 15 * 60_000, limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
