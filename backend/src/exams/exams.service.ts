import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CourseAccessService } from '../common/access/course-access.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { FlagAttemptDto } from './dto/flag-attempt.dto';

const FLAG_REASON_LABELS: Record<string, string> = {
  TAB_SWITCH: 'ndryshoi tab-in',
  WINDOW_BLUR: 'doli nga dritarja e testit',
  FULLSCREEN_EXIT: 'doli nga modaliteti fullscreen',
  COPY_PASTE: 'përdori copy/paste',
};

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private courseAccess: CourseAccessService,
  ) {}

  async create(courseId: string, userId: string, role: Role, dto: CreateExamDto) {
    await this.courseAccess.assertCanManage(courseId, userId, role);
    return this.prisma.exam.create({
      data: {
        title: dto.title,
        durationMinutes: dto.durationMinutes,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        courseId,
        createdById: userId,
      },
    });
  }

  async update(examId: string, userId: string, role: Role, dto: UpdateExamDto) {
    const exam = await this.getOrThrow(examId);
    await this.courseAccess.assertCanManage(exam.courseId, userId, role);
    if (exam.status !== 'DRAFT') {
      throw new BadRequestException('Only a draft exam can be edited. Unpublish is not supported — create a new exam instead.');
    }
    return this.prisma.exam.update({
      where: { id: examId },
      data: {
        title: dto.title,
        durationMinutes: dto.durationMinutes,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });
  }

  // Soft delete only — see courses.service.ts remove(). A student's exam
  // result must never be destroyed by this.
  async remove(examId: string, userId: string, role: Role) {
    const exam = await this.getOrThrow(examId);
    await this.courseAccess.assertCanManage(exam.courseId, userId, role);
    await this.prisma.exam.update({ where: { id: examId }, data: { archivedAt: new Date() } });
    return { success: true, archived: true };
  }

  async addQuestion(examId: string, userId: string, role: Role, dto: CreateQuestionDto) {
    const exam = await this.getOrThrow(examId);
    await this.courseAccess.assertCanManage(exam.courseId, userId, role);
    return this.prisma.examQuestion.create({
      data: {
        examId,
        type: dto.type,
        prompt: dto.prompt,
        options: dto.options,
        correctOption: dto.correctOption,
        points: dto.points ?? 1,
        order: dto.order ?? 0,
      },
    });
  }

  async publish(examId: string, userId: string, role: Role) {
    const exam = await this.getOrThrow(examId);
    await this.courseAccess.assertCanManage(exam.courseId, userId, role);
    const published = await this.prisma.exam.update({ where: { id: examId }, data: { status: 'PUBLISHED' } });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: exam.courseId },
      select: { studentId: true },
    });
    await this.notifications.createForMany(
      enrollments.map((e) => e.studentId),
      'EXAM_PUBLISHED',
      'Exam published',
      `"${exam.title}" is now open. Starts ${exam.startsAt.toLocaleString()}.`,
    );

    return published;
  }

  async listForCourse(courseId: string, userId: string, role: Role) {
    await this.courseAccess.assertCanView(courseId, userId, role);
    return this.prisma.exam.findMany({
      where: role === Role.STUDENT ? { courseId, status: 'PUBLISHED', archivedAt: null } : { courseId, archivedAt: null },
      orderBy: { startsAt: 'asc' },
    });
  }

  async getForTaking(examId: string, studentId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam || exam.archivedAt) {
      throw new NotFoundException('Exam not found');
    }
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: exam.courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course.');
    }
    if (exam.status !== 'PUBLISHED') {
      throw new ForbiddenException('This exam is not open');
    }
    const now = new Date();
    if (now < exam.startsAt || now > exam.endsAt) {
      throw new BadRequestException('This exam is not currently available');
    }

    const existing = await this.prisma.examAttempt.findUnique({ where: { examId_studentId: { examId, studentId } } });
    if (existing?.flagged) {
      throw new ForbiddenException('This attempt was closed for a suspected rule violation and cannot be resumed.');
    }

    const attempt = await this.prisma.examAttempt.upsert({
      where: { examId_studentId: { examId, studentId } },
      update: {},
      create: { examId, studentId },
      include: { answers: true },
    });

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        endsAt: exam.endsAt,
        questions: exam.questions.map((q) => ({
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          points: q.points,
          order: q.order,
        })),
      },
      attempt: {
        id: attempt.id,
        submittedAt: attempt.submittedAt,
        answers: attempt.answers,
      },
    };
  }

  async submitAnswer(examId: string, studentId: string, dto: SubmitAnswerDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId, studentId } },
    });
    if (!attempt) {
      throw new NotFoundException('Start the exam before answering');
    }
    if (attempt.submittedAt) {
      throw new BadRequestException('This attempt has already been submitted');
    }

    return this.prisma.examAnswer.upsert({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId: dto.questionId } },
      update: { selectedOption: dto.selectedOption, essayText: dto.essayText },
      create: {
        attemptId: attempt.id,
        questionId: dto.questionId,
        selectedOption: dto.selectedOption,
        essayText: dto.essayText,
      },
    });
  }

  async submitAttempt(examId: string, studentId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId, studentId } },
      include: { answers: true },
    });
    if (!attempt) {
      throw new NotFoundException('No attempt found for this exam');
    }
    if (attempt.submittedAt) {
      throw new BadRequestException('This attempt has already been submitted');
    }
    return this.scoreAndClose(examId, attempt.id, attempt.answers);
  }

  // Browser-level anti-cheat. This can only ever be a soft deterrent — a
  // determined student on their own laptop can defeat any in-browser check
  // (a second device, a VM, etc). What this DOES reliably catch is the
  // common, low-effort case: switching tabs to search an answer or message
  // someone. True lockdown would need a native proctoring client, which is
  // a separate project (see the roadmap doc).
  async flagAttempt(examId: string, studentId: string, dto: FlagAttemptDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId, studentId } },
      include: { answers: true, exam: true },
    });
    if (!attempt) {
      throw new NotFoundException('No attempt found for this exam');
    }
    if (attempt.submittedAt) {
      return { alreadyClosed: true };
    }

    await this.prisma.examAttempt.update({
      where: { id: attempt.id },
      data: { flagged: true, flagReason: dto.reason, flaggedAt: new Date() },
    });
    const result = await this.scoreAndClose(examId, attempt.id, attempt.answers);

    const student = await this.prisma.user.findUnique({ where: { id: studentId }, select: { firstName: true, lastName: true } });
    const professors = await this.prisma.course.findUnique({ where: { id: attempt.exam.courseId }, select: { professorId: true } });
    if (professors) {
      await this.notifications.create(
        professors.professorId,
        'EXAM_ATTEMPT_FLAGGED',
        'Tentativë e dyshimtë në test',
        `${student?.firstName} ${student?.lastName} — ${FLAG_REASON_LABELS[dto.reason] ?? dto.reason} gjatë "${attempt.exam.title}". Testi u mbyll automatikisht.`,
      );
    }

    return { ...result, flagged: true };
  }

  results(examId: string, userId: string, role: Role) {
    return this.getOrThrow(examId).then(async (exam) => {
      await this.courseAccess.assertCanManage(exam.courseId, userId, role);
      return this.prisma.examAttempt.findMany({
        where: { examId },
        include: { student: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { startedAt: 'asc' },
      });
    });
  }

  async myResult(examId: string, studentId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId, studentId } },
    });
    if (!attempt) {
      throw new NotFoundException('No attempt found');
    }
    return attempt;
  }

  private async scoreAndClose(examId: string, attemptId: string, answers: { questionId: string; selectedOption: number | null }[]) {
    const questions = await this.prisma.examQuestion.findMany({ where: { examId } });
    let score = 0;
    for (const q of questions) {
      if (q.type === 'MULTIPLE_CHOICE') {
        const answer = answers.find((a) => a.questionId === q.id);
        if (answer && answer.selectedOption === q.correctOption) {
          score += q.points;
        }
      }
    }
    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { submittedAt: new Date(), score },
    });
  }

  private async getOrThrow(examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.archivedAt) {
      throw new NotFoundException('Exam not found');
    }
    return exam;
  }
}
