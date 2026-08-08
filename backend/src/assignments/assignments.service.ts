import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CourseAccessService } from '../common/access/course-access.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private courseAccess: CourseAccessService,
  ) {}

  async create(courseId: string, userId: string, role: Role, dto: CreateAssignmentDto) {
    // Previously any professor could create an assignment in ANY course by
    // just supplying its id in the URL — this is the course-isolation fix.
    await this.courseAccess.assertCanManage(courseId, userId, role);

    const assignment = await this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        maxScore: dto.maxScore ?? 100,
        peerReviewEnabled: dto.peerReviewEnabled ?? false,
        courseId,
        createdById: userId,
      },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { studentId: true },
    });
    await this.notifications.createForMany(
      enrollments.map((e) => e.studentId),
      'ASSIGNMENT_CREATED',
      'New assignment posted',
      `"${assignment.title}" was added to your course.`,
    );

    return assignment;
  }

  async findForCourse(courseId: string, userId: string, role: Role) {
    await this.courseAccess.assertCanView(courseId, userId, role);
    return this.prisma.assignment.findMany({
      where: { courseId, archivedAt: null },
      orderBy: { dueDate: 'asc' },
    });
  }

  async update(assignmentId: string, userId: string, role: Role, dto: UpdateAssignmentDto) {
    const assignment = await this.getOrThrow(assignmentId);
    await this.courseAccess.assertCanManage(assignment.courseId, userId, role);
    return this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        maxScore: dto.maxScore,
        peerReviewEnabled: dto.peerReviewEnabled,
      },
    });
  }

  // Soft delete only — see courses.service.ts remove() for why. A
  // submitted student assignment must never be destroyed by this.
  async remove(assignmentId: string, userId: string, role: Role) {
    const assignment = await this.getOrThrow(assignmentId);
    await this.courseAccess.assertCanManage(assignment.courseId, userId, role);
    await this.prisma.assignment.update({ where: { id: assignmentId }, data: { archivedAt: new Date() } });
    return { success: true, archived: true };
  }

  async submit(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.getOrThrow(assignmentId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: assignment.courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course.');
    }

    // Previously not checked at all — a student could submit whenever they
    // liked, deadline or not.
    if (new Date() > assignment.dueDate) {
      throw new BadRequestException('The deadline for this assignment has passed.');
    }

    return this.prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: { content: dto.content, status: 'SUBMITTED', submittedAt: new Date() },
      create: { assignmentId, studentId, content: dto.content },
    });
  }

  async findSubmissions(assignmentId: string, userId: string, role: Role) {
    const assignment = await this.getOrThrow(assignmentId);
    // Previously any PROFESSOR/ADMIN could read submissions for any
    // assignment id — including a colleague's course. Now scoped to the
    // professor who actually teaches it, or admin.
    await this.courseAccess.assertCanManage(assignment.courseId, userId, role);
    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        grade: true,
      },
    });
  }

  // A submission is private by default. It's only visible to a classmate
  // when ALL of: the professor turned peer review on for this specific
  // assignment, AND the requesting student has already submitted their own
  // work (no reading classmates' answers for free), AND both are enrolled
  // in the same course. Grades/feedback are never included here.
  async peerSubmissions(assignmentId: string, studentId: string) {
    const assignment = await this.getOrThrow(assignmentId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: assignment.courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course.');
    }
    if (!assignment.peerReviewEnabled) {
      throw new ForbiddenException('Peer review is not enabled for this assignment.');
    }
    const own = await this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
    if (!own) {
      throw new ForbiddenException('Submit your own work first to review your classmates’ submissions.');
    }

    return this.prisma.submission.findMany({
      where: { assignmentId, studentId: { not: studentId } },
      select: {
        id: true,
        content: true,
        submittedAt: true,
        student: { select: { id: true, firstName: true, lastName: true } },
        // grade intentionally omitted — a peer never sees another
        // student's score or professor feedback.
      },
    });
  }

  private async getOrThrow(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.archivedAt) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }
}
