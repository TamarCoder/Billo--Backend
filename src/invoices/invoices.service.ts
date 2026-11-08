import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  InvoiceDraft,
  InvoiceStatus,
} from './entities/invoice-record.entity.js';
import { Company } from '../companies/entities/company.entity.js';
import { InvoiceRecord } from './entities/invoice-record.entity.js';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(InvoiceRecord)
    private readonly invoicesRepository: Repository<InvoiceRecord>,
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
  ) {}

  findAll(organizationId: string): Promise<InvoiceRecord[]> {
    return this.invoicesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(organizationId: string, invoice: InvoiceDraft): Promise<InvoiceRecord> {
    await this.assertCompanyExists(organizationId, invoice.issuerName);
    // Always a new record; an existing invoice is never overwritten.
    return this.invoicesRepository.save(
      this.invoicesRepository.create({ organizationId, invoice, status: 'draft' }),
    );
  }

  async update(
    organizationId: string,
    id: string,
    invoice: InvoiceDraft,
  ): Promise<InvoiceRecord> {
    const record = await this.findById(organizationId, id);
    // An old invoice keeps its company even after that company was renamed or deleted.
    if (invoice.issuerName !== record.invoice.issuerName) {
      await this.assertCompanyExists(organizationId, invoice.issuerName);
    }
    // A sent or printed invoice is never changed; the edit is saved as a new version.
    if (record.status === 'sent' || record.status === 'printed') {
      return this.invoicesRepository.save(
        this.invoicesRepository.create({ organizationId, invoice, status: 'draft' }),
      );
    }
    record.invoice = invoice;
    return this.invoicesRepository.save(record);
  }

  async updateStatus(
    organizationId: string,
    id: string,
    status: InvoiceStatus,
  ): Promise<InvoiceRecord> {
    const record = await this.findById(organizationId, id);
    record.status = status;
    return this.invoicesRepository.save(record);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const record = await this.findById(organizationId, id);
    await this.invoicesRepository.remove(record);
  }

  // An invoice may only be issued to a company that is in this organization's list.
  private async assertCompanyExists(organizationId: string, name: string): Promise<void> {
    const exists = await this.companies.exists({ where: { organizationId, name } });
    if (!exists) {
      throw new BadRequestException('ეს კომპანია სიაში არ არის. აირჩიეთ კომპანია სიიდან.');
    }
  }

  private async findById(organizationId: string, id: string): Promise<InvoiceRecord> {
    const record = await this.invoicesRepository.findOneBy({ id, organizationId });
    if (!record) {
      throw new NotFoundException('ინვოისი ვერ მოიძებნა.');
    }
    return record;
  }
}
