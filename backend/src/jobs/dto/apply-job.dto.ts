import { IsOptional, IsString } from 'class-validator';

export class ApplyJobDto {
  @IsOptional()
  @IsString()
  message?: string;
}
