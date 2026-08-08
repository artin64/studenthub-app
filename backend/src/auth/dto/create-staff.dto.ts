import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

// Used by an existing admin to create a PROFESSOR or another ADMIN account
// directly, pre-approved (status ACTIVE immediately, no waiting on
// approval). This is the real bootstrap path for onboarding a school's
// first admin/professor accounts instead of editing the database by hand.
export enum StaffRole {
  PROFESSOR = 'PROFESSOR',
  ADMIN = 'ADMIN',
}

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(StaffRole)
  role: Role;
}
