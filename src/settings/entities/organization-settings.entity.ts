import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organization_settings')
export class OrganizationSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  // The account's own organization; /api/settings reads and writes this row.
  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ type: 'varchar', length: 300 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  issuerAddress!: string;

  @Column({ type: 'varchar', length: 100 })
  issuerIdentificationNumber!: string;

  @Column({ type: 'varchar', length: 200 })
  bankName!: string;

  @Column({ type: 'varchar', length: 100 })
  bankCode!: string;

  @Column({ type: 'varchar', length: 100 })
  bankAccount!: string;
}
