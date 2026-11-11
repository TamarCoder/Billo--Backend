import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceForm } from './entities/invoice-form.entity.js';
import { InvoiceFormsController } from './invoice-forms.controller.js';
import { InvoiceFormsService } from './invoice-forms.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceForm])],
  controllers: [InvoiceFormsController],
  providers: [InvoiceFormsService],
  exports: [InvoiceFormsService],
})
export class InvoiceFormsModule {}
