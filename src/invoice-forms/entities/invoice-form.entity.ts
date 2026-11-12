import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type InvoiceFormStatus =
  | 'submitted'
  | 'in_progress'
  | 'review'
  | 'approved'
  | 'changes_requested'
  | 'live';

@Entity('invoice_forms')
export class InvoiceForm {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'integer' })
  size!: number;

  // Not loaded by default: lists must not pull every file into memory.
  @Column({ type: 'bytea', select: false })
  data!: Buffer;

  @Column({ type: 'varchar', length: 20, default: 'submitted' })
  status!: InvoiceFormStatus;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment!: string | null;

  @Column({ name: 'template_key', type: 'varchar', length: 50, nullable: true })
  templateKey!: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
