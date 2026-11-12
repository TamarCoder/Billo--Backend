import { IsString, Matches } from 'class-validator';

export class SendForReviewDto {
  // Same format as the frontend template registry keys.
  @IsString()
  @Matches(/^[a-z0-9-]{1,50}$/u, { message: 'template key must be lowercase letters, digits or dashes' })
  templateKey!: string;
}
