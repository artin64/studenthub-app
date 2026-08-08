import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAlumniDto {
  @IsBoolean()
  isAlumnus: boolean;

  @IsOptional()
  @IsString()
  alumniCompany?: string;

  @IsOptional()
  @IsString()
  alumniRole?: string;
}
