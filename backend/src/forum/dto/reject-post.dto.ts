import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
