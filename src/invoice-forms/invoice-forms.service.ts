import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceForm } from './entities/invoice-form.entity.js';

export const MAX_FORM_BYTES = 5 * 1024 * 1024;

export const ALLOWED_FORM_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
]);

export interface UploadedForm {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class InvoiceFormsService {
  constructor(
    @InjectRepository(InvoiceForm)
    private readonly forms: Repository<InvoiceForm>,
  ) {}

  findAll(organizationId: string): Promise<InvoiceForm[]> {
    return this.forms.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findFile(organizationId: string, id: string): Promise<InvoiceForm> {
    const form = await this.forms.findOne({
      where: { id, organizationId },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        size: true,
        data: true,
      },
    });
    if (!form) throw new NotFoundException('ფორმა ვერ მოიძებნა.');
    return form;
  }

  async create(
    organizationId: string,
    file: UploadedForm | undefined,
  ): Promise<InvoiceForm> {
    if (!file) throw new BadRequestException('ფაილი არ არის არჩეული.');
    if (!ALLOWED_FORM_TYPES.has(file.mimetype)) {
      throw new BadRequestException('ფაილის ეს ტიპი დაუშვებელია.');
    }
    // Multer sends latin1 names; Georgian names need UTF-8.
    const fileName = Buffer.from(file.originalname, 'latin1')
      .toString('utf8')
      .slice(0, 255);
    const saved = await this.forms.save(
      this.forms.create({
        organizationId,
        fileName,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer,
      }),
    );
    const { data: _data, ...view } = saved;
    return view as InvoiceForm;
  }

  async remove(id: string): Promise<void> {
    const result = await this.forms.delete({ id });
    if (!result.affected) throw new NotFoundException('ფორმა ვერ მოიძებნა.');
  }

  countAll(): Promise<number> {
    return this.forms.count();
  }

  countByOrganization(): Promise<{ organizationId: string; count: string }[]> {
    return this.forms
      .createQueryBuilder('form')
      .select('form.organization_id', 'organizationId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('form.organization_id')
      .getRawMany();
  }
}
