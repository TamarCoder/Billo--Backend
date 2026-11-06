import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsuranceCompany } from './entities/insurance-company.entity.js';
import { CompaniesService } from './companies.service.js';
import { CompaniesController } from './companies.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([InsuranceCompany])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}