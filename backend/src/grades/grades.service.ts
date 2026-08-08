import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CourseAccessService } from '../common/access/course-access.service';
import { CreateGradeDto } from './dto/create-grade.dto';

@Injectable()
export class GradesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private courseAccess: CourseAccessService,
  ) {}

  async gradeSubmission(submissionId: string, givenById: string, role: Role, dto: CreateGradeDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: { select: { title: true, courseId: true } } },
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    // Previously any professor/admin could grade any submission from any
    // course — now scoped to the professor who actually teaches it.
    await this.courseAccess.assertCanManage(submission.assignment.courseId, givenById, role);

    const grade = await this.prisma.grade.upsert({
      where: { submissionId },
      update: { score: dto.score, feedback: dto.feedback, gradedAt: new Date() },
      create: {
        submissionId,
        studentId: submission.studentId,
        givenById,
        score: dto.score,
        feedback: dto.feedback,
      },
    });

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'REVIEWED' },
    });

    await this.notifications.create(
      submission.studentId,
      'SUBMISSION_GRADED',
      'Assignment graded',
      `"${submission.assignment.title}" was graded: ${dto.score} points.`,
    );

    return grade;
  }

  myGrades(studentId: string) {
    return this.prisma.grade.findMany({
      where: { studentId },
      include: {
        submission: { include: { assignment: { select: { title: true, courseId: true } } } },
      },
    });
  }
}
