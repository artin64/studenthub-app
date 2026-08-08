import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  prompt: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsInt()
  correctOption?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @IsOptional()
  @IsInt()
  order?: number;
}
