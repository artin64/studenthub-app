import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { FlagAttemptDto } from './dto/flag-attempt.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Post('courses/:courseId/exams')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  create(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string, @Body() dto: CreateExamDto) {
    return this.examsService.create(courseId, user.id, user.role, dto);
  }

  @Get('courses/:courseId/exams')
  listForCourse(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string) {
    return this.examsService.listForCourse(courseId, user.id, user.role);
  }

  @Patch('exams/:examId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  update(@CurrentUser() user: AuthUser, @Param('examId') examId: string, @Body() dto: UpdateExamDto) {
    return this.examsService.update(examId, user.id, user.role, dto);
  }

  @Delete('exams/:examId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  remove(@CurrentUser() user: AuthUser, @Param('examId') examId: string) {
    return this.examsService.remove(examId, user.id, user.role);
  }

  @Post('exams/:examId/questions')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  addQuestion(@CurrentUser() user: AuthUser, @Param('examId') examId: string, @Body() dto: CreateQuestionDto) {
    return this.examsService.addQuestion(examId, user.id, user.role, dto);
  }

  @Post('exams/:examId/publish')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  publish(@CurrentUser() user: AuthUser, @Param('examId') examId: string) {
    return this.examsService.publish(examId, user.id, user.role);
  }

  @Get('exams/:examId/take')
  @Roles(Role.STUDENT)
  take(@CurrentUser() user: AuthUser, @Param('examId') examId: string) {
    return this.examsService.getForTaking(examId, user.id);
  }

  @Post('exams/:examId/answer')
  @Roles(Role.STUDENT)
  answer(@CurrentUser() user: AuthUser, @Param('examId') examId: string, @Body() dto: SubmitAnswerDto) {
    return this.examsService.submitAnswer(examId, user.id, dto);
  }

  @Post('exams/:examId/submit')
  @Roles(Role.STUDENT)
  submit(@CurrentUser() user: AuthUser, @Param('examId') examId: string) {
    return this.examsService.submitAttempt(examId, user.id);
  }

  // Called by the frontend's proctoring listeners (tab switch, window
  // blur, fullscreen exit) — see ExamTakePage.tsx.
  @Post('exams/:examId/flag')
  @Roles(Role.STUDENT)
  flag(@CurrentUser() user: AuthUser, @Param('examId') examId: string, @Body() dto: FlagAttemptDto) {
    return this.examsService.flagAttempt(examId, user.id, dto);
  }

  @Get('exams/:examId/results')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  results(@CurrentUser() user: AuthUser, @Param('examId') examId: string) {
    return this.examsService.results(examId, user.id, user.role);
  }

  @Get('exams/:examId/my-result')
  @Roles(Role.STUDENT)
  myResult(@CurrentUser() user: AuthUser, @Param('examId') examId: string) {
    return this.examsService.myResult(examId, user.id);
  }
}
