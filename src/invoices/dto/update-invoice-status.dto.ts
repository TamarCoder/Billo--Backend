import { IsIn } from 'class-validator';
import type { InvoiceStatus } from '../entities/invoice-record.entity.js';

const invoiceStatuses: InvoiceStatus[] = ['none', 'draft', 'sent', 'printed'];

export class UpdateInvoiceStatusDto {
  @IsIn(invoiceStatuses)
  status!: InvoiceStatus;
}
