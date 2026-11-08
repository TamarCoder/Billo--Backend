import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationSettings } from '../settings/entities/organization-settings.entity.js';
import { IssuersController } from './issuers.controller.js';
import { IssuersService } from './issuers.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationSettings])],
  controllers: [IssuersController],
  providers: [IssuersService],
})
export class IssuersModule {}
