import { IsOptional, IsString } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  link?: string;
}
