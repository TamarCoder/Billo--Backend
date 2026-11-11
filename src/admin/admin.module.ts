import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity.js';
import { InvoiceFormsModule } from '../invoice-forms/invoice-forms.module.js';
import { Organization } from '../organizations/entities/organization.entity.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Company]),
    InvoiceFormsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
