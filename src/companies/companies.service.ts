import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity.js';

type CompanyInput = {
  number: string;
  name: string;
};

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  findAll(organizationId: string): Promise<Company[]> {
    return this.companiesRepository.find({
      where: { organizationId },
      order: { number: 'ASC' },
    });
  }

  async create(organizationId: string, input: CompanyInput): Promise<Company> {
    await this.ensureNumberIsFree(organizationId, input.number);

    const company = this.companiesRepository.create({
      organizationId,
      number: input.number,
      name: input.name,
    });
    return this.companiesRepository.save(company);
  }

  async update(
    organizationId: string,
    id: string,
    input: CompanyInput,
  ): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id, organizationId });
    if (!company) {
      throw new NotFoundException('კომპანია ვერ მოიძებნა.');
    }

    if (company.number !== input.number) {
      await this.ensureNumberIsFree(organizationId, input.number);
    }

    company.number = input.number;
    company.name = input.name;
    return this.companiesRepository.save(company);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const company = await this.companiesRepository.findOneBy({ id, organizationId });
    if (!company) {
      throw new NotFoundException('კომპანია ვერ მოიძებნა.');
    }

    await this.companiesRepository.remove(company);
  }

  private async ensureNumberIsFree(organizationId: string, number: string): Promise<void> {
    const existing = await this.companiesRepository.findOneBy({ organizationId, number });
    if (existing) {
      throw new ConflictException('ამ ნომრით კომპანია უკვე არსებობს.');
    }
  }
}