import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsuranceCompany } from './entities/insurance-company.entity.js';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(InsuranceCompany)
    private readonly companiesRepository: Repository<InsuranceCompany>,
  ) {}

  findAll(): Promise<InsuranceCompany[]> {
    return this.companiesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async create(name: string): Promise<InsuranceCompany> {
    const company = this.companiesRepository.create({ name });
    return this.companiesRepository.save(company);
  }

  async update(id: string, name: string): Promise<InsuranceCompany> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) {
      throw new NotFoundException('კომპანია ვერ მოიძებნა.');
    }

    company.name = name;
    return this.companiesRepository.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) {
      throw new NotFoundException('კომპანია ვერ მოიძებნა.');
    }

    await this.companiesRepository.remove(company);
  }
}
