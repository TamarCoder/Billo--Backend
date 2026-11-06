import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('insurance_companies')
export class InsuranceCompany {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;
}
