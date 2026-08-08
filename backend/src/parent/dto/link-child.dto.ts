import { IsEmail } from 'class-validator';

export class LinkChildDto {
  @IsEmail()
  studentEmail: string;
}
