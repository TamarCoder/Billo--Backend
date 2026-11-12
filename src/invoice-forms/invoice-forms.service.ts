import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type EntityManager } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity.js';
import {
  InvoiceForm,
  type InvoiceFormStatus,
} from './entities/invoice-form.entity.js';

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

  // Organization: accept the form an admin prepared.
  approve(organizationId: string, id: string): Promise<InvoiceForm> {
    return this.transition(organizationId, id, ['review'], {
      status: 'approved',
      reviewedAt: new Date(),
      reviewComment: null,
    });
  }

  // Organization: send the form back with a comment.
  requestChanges(
    organizationId: string,
    id: string,
    comment: string,
  ): Promise<InvoiceForm> {
    return this.transition(organizationId, id, ['review'], {
      status: 'changes_requested',
      reviewedAt: new Date(),
      reviewComment: comment,
    });
  }

  // Admin: start building the template.
  start(organizationId: string, id: string): Promise<InvoiceForm> {
    return this.transition(
      organizationId,
      id,
      ['submitted', 'changes_requested'],
      { status: 'in_progress' },
    );
  }

  // Admin: show the built template to the organization.
  sendForReview(
    organizationId: string,
    id: string,
    templateKey: string,
  ): Promise<InvoiceForm> {
    return this.transition(organizationId, id, ['in_progress'], {
      status: 'review',
      templateKey,
    });
  }

  // Admin: make the approved template available to the organization.
  // The form and the organization change together, or not at all.
  publish(organizationId: string, id: string): Promise<InvoiceForm> {
    return this.forms.manager.transaction(async (manager) => {
      const form = await this.transition(
        organizationId,
        id,
        ['approved'],
        { status: 'live', publishedAt: new Date() },
        manager,
      );
      if (form.templateKey) {
        await manager
          .createQueryBuilder()
          .update(Organization)
          .set({
            invoiceTemplates: () =>
              'array_append("invoice_templates", :templateKey)',
          })
          .where('id = :organizationId', { organizationId })
          .andWhere('NOT (:templateKey = ANY("invoice_templates"))')
          .setParameter('templateKey', form.templateKey)
          .execute();
      }
      return form;
    });
  }

  // One conditional UPDATE: two requests at the same time cannot both pass the status check.
  private async transition(
    organizationId: string,
    id: string,
    from: InvoiceFormStatus[],
    changes: Partial<InvoiceForm>,
    manager: EntityManager = this.forms.manager,
  ): Promise<InvoiceForm> {
    const result = await manager.update(
      InvoiceForm,
      { id, organizationId, status: In(from) },
      changes,
    );
    const form = await manager.findOne(InvoiceForm, {
      where: { id, organizationId },
    });
    if (!form) throw new NotFoundException('ფორმა ვერ მოიძებნა.');
    if (!result.affected) {
      throw new ConflictException(
        'ამ სტატუსიდან ეს მოქმედება დაუშვებელია.',
      );
    }
    return form;
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
