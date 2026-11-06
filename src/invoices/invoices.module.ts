import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceRecord } from './entities/invoice-record.entity.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceRecord])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
