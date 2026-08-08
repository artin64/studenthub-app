import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
