import { IsOptional, IsString } from 'class-validator';

export class UpdateCvDto {
  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  skills?: string;
}
