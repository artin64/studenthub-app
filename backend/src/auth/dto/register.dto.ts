import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

// Deliberately NOT the full Role enum: nobody should be able to
// self-register as ADMIN. Admin accounts are created by an existing admin
// via POST /auth/create-staff (see auth.controller.ts), never through the
// public registration form.
export enum PublicRole {
  STUDENT = 'STUDENT',
  PROFESSOR = 'PROFESSOR',
  PARENT = 'PARENT',
  COMPANY = 'COMPANY',
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(PublicRole)
  role: Role;
}
