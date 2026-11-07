import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsuranceCompany } from './entities/insurance-company.entity.js';

type CompanyInput = {
  number: string;
  name: string;
};

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(InsuranceCompany)
    private readonly companiesRepository: Repository<InsuranceCompany>,
  ) {}

  findAll(): Promise<InsuranceCompany[]> {
    return this.companiesRepository.find({
      order: { number: 'ASC' },
    });
  }

  async create(input: CompanyInput): Promise<InsuranceCompany> {
    await this.ensureNumberIsFree(input.number);

    const company = this.companiesRepository.create({
      number: input.number,
      name: input.name,
    });
    return this.companiesRepository.save(company);
  }

  async update(id: string, input: CompanyInput): Promise<InsuranceCompany> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) {
      throw new NotFoundException('კომპანია ვერ მოიძებნა.');
    }

    if (company.number !== input.number) {
      await this.ensureNumberIsFree(input.number);
    }

    company.number = input.number;
    company.name = input.name;
    return this.companiesRepository.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) {
      throw new NotFoundException('კომპანია ვერ მოიძებნა.');
    }

    await this.companiesRepository.remove(company);
  }

  private async ensureNumberIsFree(number: string): Promise<void> {
    const existing = await this.companiesRepository.findOneBy({ number });
    if (existing) {
      throw new ConflictException('ამ ნომრით კომპანია უკვე არსებობს.');
    }
  }
}