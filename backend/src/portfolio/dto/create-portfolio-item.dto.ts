import { IsOptional, IsString } from 'class-validator';

export class CreatePortfolioItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  link?: string;
}
