import { ArrayMaxSize, IsArray, IsString, Matches } from 'class-validator';

export class InvoiceTemplatesDto {
  // Template keys match the frontend registry: lowercase letters, digits and dashes.
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Matches(/^[a-z0-9-]{1,50}$/u, { each: true, message: 'template keys must be lowercase letters, digits or dashes' })
  templates!: string[];
}
