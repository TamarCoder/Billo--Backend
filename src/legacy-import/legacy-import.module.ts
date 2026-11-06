import { Module } from '@nestjs/common';
import { LegacyImportController } from './legacy-import.controller.js';
import { LegacyImportService } from './legacy-import.service.js';

@Module({
  controllers: [LegacyImportController],
  providers: [LegacyImportService],
})
export class LegacyImportModule {}
