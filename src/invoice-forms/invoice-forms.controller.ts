import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import { CurrentOrganization } from '../auth/current-organization.decorator.js';
import type { OrganizationView } from '../auth/auth.service.js';
import { InvoiceFormsService } from './invoice-forms.service.js';

// The logged-in organization's own forms, uploaded by an admin.
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
