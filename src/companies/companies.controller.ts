import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentOrganization } from '../auth/current-organization.decorator.js';
import type { OrganizationView } from '../auth/auth.service.js';
import { CompaniesService } from './companies.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@Controller('api/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@CurrentOrganization() org: OrganizationView) {
    return this.companiesService.findAll(org.id);
  }

  @Post()
  create(@CurrentOrganization() org: OrganizationView, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(org.id, {
      number: dto.number,
      name: dto.name,
    });
  }

  @Put(':id')
  update(
    @CurrentOrganization() org: OrganizationView,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(org.id, id, {
      number: dto.number,
      name: dto.name,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentOrganization() org: OrganizationView,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.companiesService.remove(org.id, id);
  }
}