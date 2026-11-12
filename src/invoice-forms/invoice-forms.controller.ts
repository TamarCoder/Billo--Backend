import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentOrganization } from '../auth/current-organization.decorator.js';
import type { OrganizationView } from '../auth/auth.service.js';
import { RequestChangesDto } from './dto/request-changes.dto.js';
import {
  InvoiceFormsService,
  MAX_FORM_BYTES,
  type UploadedForm,
} from './invoice-forms.service.js';

// The logged-in organization's own forms. Every call is limited to org.id.
@Controller('api/invoice-forms')
export class InvoiceFormsController {
  constructor(private readonly formsService: InvoiceFormsService) {}

  @Get()
  findAll(@CurrentOrganization() org: OrganizationView) {
    return this.formsService.findAll(org.id);
  }

  @Get(':id/file')
  async download(
    @CurrentOrganization() org: OrganizationView,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return toFile(await this.formsService.findFile(org.id, id));
  }

  // The organization uploads a sample invoice for an admin to build.
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FORM_BYTES } }),
  )
  upload(
    @CurrentOrganization() org: OrganizationView,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FORM_BYTES })],
      }),
    )
    file: UploadedForm,
  ) {
    return this.formsService.create(org.id, file);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentOrganization() org: OrganizationView,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.formsService.approve(org.id, id);
  }

  @Post(':id/request-changes')
  @HttpCode(HttpStatus.OK)
  requestChanges(
    @CurrentOrganization() org: OrganizationView,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestChangesDto,
  ) {
    return this.formsService.requestChanges(org.id, id, dto.comment);
  }
}

export function toFile(form: {
  fileName: string;
  mimeType: string;
  size: number;
  data: Buffer;
}) {
  return new StreamableFile(form.data, {
    type: form.mimeType,
    length: form.size,
    disposition: `attachment; filename*=UTF-8''${encodeURIComponent(form.fileName)}`,
  });
}
