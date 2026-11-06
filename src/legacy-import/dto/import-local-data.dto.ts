import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { InvoiceDraftDto } from '../../invoices/dto/invoice-draft.dto.js';
import type { InvoiceStatus } from '../../invoices/entities/invoice-record.entity.js';
import { UpdateOrganizationSettingsDto } from '../../settings/dto/update-organization-settings.dto.js';

class LegacyCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id?: string;

  @IsString()
  @MaxLength(200)
  name!: string;
}

class LegacyInvoiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsIn(['none', 'draft', 'sent', 'printed'])
  status!: InvoiceStatus;

  @ValidateNested()
  @Type(() => InvoiceDraftDto)
  invoice!: InvoiceDraftDto;
}

export class ImportLocalDataDto {
  @IsString()
  @MaxLength(512)
  source!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => LegacyCompanyDto)
  companies?: LegacyCompanyDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10000)
  @ValidateNested({ each: true })
  @Type(() => LegacyInvoiceDto)
  invoices?: LegacyInvoiceDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOrganizationSettingsDto)
  settings?: UpdateOrganizationSettingsDto;
}
