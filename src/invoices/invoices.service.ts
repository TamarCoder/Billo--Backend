import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  InvoiceDraft,
  InvoiceStatus,
} from './entities/invoice-record.entity.js';
import { InvoiceRecord } from './entities/invoice-record.entity.js';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(InvoiceRecord)
    private readonly invoicesRepository: Repository<InvoiceRecord>,
  ) {}

  findAll(): Promise<InvoiceRecord[]> {
    return this.invoicesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async create(invoice: InvoiceDraft): Promise<InvoiceRecord> {
    const existing = await this.invoicesRepository
      .createQueryBuilder('record')
      .where(`record.invoice ->> 'issuerName' = :issuerName`, {
        issuerName: invoice.issuerName,
      })
      .andWhere(`record.invoice ->> 'reportingMonth' = :reportingMonth`, {
        reportingMonth: invoice.reportingMonth,
      })
      .getOne();
    if (existing) {
      existing.invoice = invoice;
      return this.invoicesRepository.save(existing);
    }

    return this.invoicesRepository.save(
      this.invoicesRepository.create({ invoice, status: 'draft' }),
    );
  }

  async update(id: string, invoice: InvoiceDraft): Promise<InvoiceRecord> {
    const record = await this.findById(id);
    record.invoice = invoice;
    return this.invoicesRepository.save(record);
  }

  async updateStatus(
    id: string,
    status: InvoiceStatus,
  ): Promise<InvoiceRecord> {
    const record = await this.findById(id);
    record.status = status;
    return this.invoicesRepository.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findById(id);
    await this.invoicesRepository.remove(record);
  }

  private async findById(id: string): Promise<InvoiceRecord> {
    const record = await this.invoicesRepository.findOneBy({ id });
    if (!record) {
      throw new NotFoundException('ინვოისი ვერ მოიძებნა.');
    }
    return record;
  }
}
