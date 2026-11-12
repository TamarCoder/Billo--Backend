import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type OrganizationRole = 'organization' | 'admin';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'identification_code', type: 'varchar', length: 11, unique: true })
  identificationCode!: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 16, default: 'organization' })
  role!: OrganizationRole;

  // Keys of the invoice templates built in the frontend for this organization (e.g. "tatishvili").
  // Empty means the organization uses the standard template.
  @Column({ name: 'invoice_templates', type: 'text', array: true, default: () => "'{}'" })
  invoiceTemplates!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
