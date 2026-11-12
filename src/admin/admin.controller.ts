import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  MaxFileSizeValidator,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegisterDto } from '../auth/dto/register.dto.js';
import { InvoiceTemplatesDto } from './dto/invoice-templates.dto.js';
import { toFile } from '../invoice-forms/invoice-forms.controller.js';
import {
  InvoiceFormsService,
  MAX_FORM_BYTES,
  type UploadedForm,
} from '../invoice-forms/invoice-forms.service.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly formsService: InvoiceFormsService,
  ) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('system')
  getSystemStatus() {
    return this.adminService.getSystemStatus();
  }

  @Get('organizations')
  listOrganizations() {
    return this.adminService.listOrganizations();
  }

  @Post('organizations')
  createOrganization(@Body() dto: RegisterDto) {
    return this.adminService.createOrganization(dto);
  }

  @Get('organizations/:id')
  getOrganization(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrganization(id);
  }

  @Get('organizations/:id/companies')
  listCompanies(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.listCompanies(id);
  }

  // Which coded invoice templates this organization sees on its Forms page.
  @Put('organizations/:id/invoice-templates')
  setInvoiceTemplates(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InvoiceTemplatesDto,
  ) {
    return this.adminService.setInvoiceTemplates(id, dto.templates);
  }

  @Get('organizations/:id/forms')
  async listForms(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.getOrganization(id);
    return this.formsService.findAll(id);
  }

  @Post('organizations/:id/forms')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FORM_BYTES } }),
  )
  async uploadForm(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FORM_BYTES })],
      }),
    )
    file: UploadedForm,
  ) {
    await this.adminService.getOrganization(id);
    return this.formsService.create(id, file);
  }

  @Get('organizations/:id/forms/:formId/file')
  async downloadForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('formId', ParseUUIDPipe) formId: string,
  ) {
    return toFile(await this.formsService.findFile(id, formId));
  }

  @Delete('forms/:formId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeForm(@Param('formId', ParseUUIDPipe) formId: string) {
    return this.formsService.remove(formId);
  }
}
