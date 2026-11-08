import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto.js';
import { CurrentOrganization } from '../auth/current-organization.decorator.js';
import type { OrganizationView } from '../auth/auth.service.js';
import { InvoicesService } from './invoices.service.js';

@Controller('api/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@CurrentOrganization() org: OrganizationView) {
    return this.invoicesService.findAll(org.id);
  }

  @Post()
  create(@CurrentOrganization() org: OrganizationView, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(org.id, dto);
  }

  @Put(':id')
  update(
    @CurrentOrganization() org: OrganizationView,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(org.id, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentOrganization() org: OrganizationView,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoicesService.updateStatus(org.id, id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentOrganization() org: OrganizationView,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.remove(org.id, id);
  }
}
