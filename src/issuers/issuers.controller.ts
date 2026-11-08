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
import { UpdateOrganizationSettingsDto } from '../settings/dto/update-organization-settings.dto.js';
import { IssuersService } from './issuers.service.js';

@Controller('api/issuers')
export class IssuersController {
  constructor(private readonly issuersService: IssuersService) {}

  @Get()
  findAll(@CurrentOrganization() org: OrganizationView) {
    return this.issuersService.findAll(org.id);
  }

  @Post()
  create(@CurrentOrganization() org: OrganizationView, @Body() dto: UpdateOrganizationSettingsDto) {
    return this.issuersService.create(org.id, dto);
  }

  @Put(':id')
  update(
    @CurrentOrganization() org: OrganizationView,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationSettingsDto,
  ) {
    return this.issuersService.update(org.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentOrganization() org: OrganizationView, @Param('id', ParseUUIDPipe) id: string) {
    return this.issuersService.remove(org.id, id);
  }
}
