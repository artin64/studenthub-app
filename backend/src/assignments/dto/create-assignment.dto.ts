import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxScore?: number;

  // Off by default: a submission is private to the submitting student and
  // the professor until a professor explicitly turns this on for a given
  // assignment. See assignments.service.ts peerSubmissions().
  @IsOptional()
  @IsBoolean()
  peerReviewEnabled?: boolean;
}
