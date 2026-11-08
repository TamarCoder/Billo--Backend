import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('companies')
@Unique('UQ_companies_org_number', ['organizationId', 'number'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 50 })
  number!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;
}