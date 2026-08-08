import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateSessionDto {
  // Teacher-configurable validity window for the QR/numeric code — capped
  // at 4 hours so a mistaken huge value doesn't leave a code scannable all
  // day.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  durationMinutes?: number;
}
