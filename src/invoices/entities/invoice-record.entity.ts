import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type InvoiceStatus = 'none' | 'draft' | 'sent' | 'printed';

export interface InvoiceDraft {
  title: string;
  invoiceNumber: string;
  reportingDate: string;
  sendingDate: string;
  amount: string;
  amountInWords: string;
  reportingMonth: string;
  reportingDescription: string;
  issuerName: string;
  issuerIdentificationNumber: string;
  issuerAddress: string;
  bankAccount: string;
  bankName: string;
  bankCode: string;
}

@Entity('invoice_records')
export class InvoiceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'varchar', length: 16, default: 'draft' })
  status!: InvoiceStatus;

  @Column({ type: 'jsonb' })
  invoice!: InvoiceDraft;
}
