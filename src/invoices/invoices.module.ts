import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity.js';
import { InvoiceRecord } from './entities/invoice-record.entity.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceRecord, Company])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
