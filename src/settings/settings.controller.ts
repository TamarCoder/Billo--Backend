import { Body, Controller, Get, Put } from '@nestjs/common';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto.js';
import { CurrentOrganization } from '../auth/current-organization.decorator.js';
import type { OrganizationView } from '../auth/auth.service.js';
import { SettingsService } from './settings.service.js';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(@CurrentOrganization() org: OrganizationView) {
    return this.settingsService.get(org);
  }

  @Put()
  update(
    @CurrentOrganization() org: OrganizationView,
    @Body() dto: UpdateOrganizationSettingsDto,
  ) {
    return this.settingsService.update(org.id, dto);
  }
}
