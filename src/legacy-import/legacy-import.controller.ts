import { Body, Controller, Post } from '@nestjs/common';
import { ImportLocalDataDto } from './dto/import-local-data.dto.js';
import { LegacyImportService } from './legacy-import.service.js';

@Controller('api/migration')
export class LegacyImportController {
  constructor(private readonly legacyImportService: LegacyImportService) {}

  @Post('import-local-data')
  importLocalData(@Body() data: ImportLocalDataDto) {
    return this.legacyImportService.importLocalData(data);
  }
}
