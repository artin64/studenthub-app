import { IsInt, IsOptional, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  questionId: string;

  @IsOptional()
  @IsInt()
  selectedOption?: number;

  @IsOptional()
  @IsString()
  essayText?: string;
}
