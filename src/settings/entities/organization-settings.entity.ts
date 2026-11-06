import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('organization_settings')
export class OrganizationSettings {
  @PrimaryColumn({ type: 'smallint' })
  id = 1;

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
