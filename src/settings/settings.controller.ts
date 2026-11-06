import { Body, Controller, Get, Put } from '@nestjs/common';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto.js';
import { SettingsService } from './settings.service.js';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get() {
    return this.settingsService.get();
  }

  @Put()
  update(@Body() dto: UpdateOrganizationSettingsDto) {
    return this.settingsService.update(dto);
  }
}
