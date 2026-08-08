import { IsString } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  title: string;

  @IsString()
  url: string;
}
