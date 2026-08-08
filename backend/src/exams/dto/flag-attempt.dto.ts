import { IsIn, IsString } from 'class-validator';

// Keep this to a small closed set of reasons the frontend proctoring
// listeners can actually detect — see ExamTakePage.tsx.
export class FlagAttemptDto {
  @IsString()
  @IsIn(['TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'COPY_PASTE'])
  reason: string;
}
