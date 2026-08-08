import { IsDateString, IsInt, IsString, Min } from 'class-validator';

export class CreateExamDto {
  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;
}
