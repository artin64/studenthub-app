import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ParentLinkStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ParentService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Just knowing a student's email is no longer enough to see their data —
  // this creates a PENDING request. Nothing is visible to the parent until
  // a professor who actually teaches that student, or an admin, approves it.
  async linkChild(parentId: string, studentEmail: string) {
    const student = await this.prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException('No student found with that email');
    }
    const link = await this.prisma.parentLink.upsert({
      where: { parentId_studentId: { parentId, studentId: student.id } },
      update: {},
      create: { parentId, studentId: student.id, status: ParentLinkStatus.PENDING },
    });

    const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN, status: 'ACTIVE' }, select: { id: true } });
    await this.notifications.createForMany(
      admins.map((a) => a.id),
      'PARENT_LINK_REQUESTED',
      'Kërkesë e re prind–nxënës',
      `Një prind kërkoi lidhje me nxënësin ${student.firstName} ${student.lastName} — pret miratim.`,
    );

    return link;
  }

  async myChildren(parentId: string) {
    const links = await this.prisma.parentLink.findMany({
      where: { parentId, status: ParentLinkStatus.APPROVED },
      include: { student: { select: { id: true, firstName: true, lastName: true, email: true, profileImageUrl: true } } },
    });
    return links.map((l) => l.student);
  }

  async myPendingRequests(parentId: string) {
    return this.prisma.parentLink.findMany({
      where: { parentId, status: { in: [ParentLinkStatus.PENDING, ParentLinkStatus.REJECTED] } },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // A professor only sees/approves requests for students actually enrolled
  // in one of their own courses — not every pending request platform-wide.
  async listPendingForApprover(approverId: string, approverRole: Role) {
    if (approverRole === Role.ADMIN) {
      return this.prisma.parentLink.findMany({
        where: { status: ParentLinkStatus.PENDING },
        include: {
          parent: { select: { id: true, firstName: true, lastName: true, email: true } },
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
    }
    return this.prisma.parentLink.findMany({
      where: {
        status: ParentLinkStatus.PENDING,
        student: { enrollments: { some: { course: { professorId: approverId } } } },
      },
      include: {
        parent: { select: { id: true, firstName: true, lastName: true, email: true } },
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveLink(linkId: string, approverId: string, approverRole: Role) {
    const link = await this.getPendingLinkOrThrow(linkId, approverId, approverRole);
    const updated = await this.prisma.parentLink.update({
      where: { id: linkId },
      data: { status: ParentLinkStatus.APPROVED, approvedById: approverId, approvedAt: new Date(), rejectionReason: null },
      include: { parent: true, student: { select: { firstName: true, lastName: true } } },
    });

    await this.notifications.create(
      link.parentId,
      'PARENT_LINK_APPROVED',
      'Lidhja me nxënësin u miratua',
      `Tani keni qasje te të dhënat e ${updated.student.firstName} ${updated.student.lastName}.`,
    );
    return updated;
  }

  async rejectLink(linkId: string, approverId: string, approverRole: Role, reason?: string) {
    const link = await this.getPendingLinkOrThrow(linkId, approverId, approverRole);
    const updated = await this.prisma.parentLink.update({
      where: { id: linkId },
      data: { status: ParentLinkStatus.REJECTED, rejectionReason: reason ?? null },
    });

    await this.notifications.create(
      link.parentId,
      'PARENT_LINK_REJECTED',
      'Kërkesa për lidhje u refuzua',
      reason ?? 'Kërkesa juaj për lidhje me këtë nxënës u refuzua.',
    );
    return updated;
  }

  private async getPendingLinkOrThrow(linkId: string, approverId: string, approverRole: Role) {
    const link = await this.prisma.parentLink.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException('Request not found');
    }
    if (link.status !== ParentLinkStatus.PENDING) {
      throw new ForbiddenException('This request has already been decided.');
    }
    if (approverRole === Role.PROFESSOR) {
      const teaches = await this.prisma.enrollment.findFirst({
        where: { studentId: link.studentId, course: { professorId: approverId } },
      });
      if (!teaches) {
        throw new ForbiddenException('You can only approve requests for students enrolled in your own courses.');
      }
    }
    return link;
  }

  private async assertApprovedLink(parentId: string, studentId: string) {
    const link = await this.prisma.parentLink.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
    });
    if (!link || link.status !== ParentLinkStatus.APPROVED) {
      throw new ForbiddenException('This student is not linked to your account (or the link is still pending approval)');
    }
  }

  async childOverview(parentId: string, studentId: string) {
    await this.assertApprovedLink(parentId, studentId);

    const [grades, attendanceCount, enrollments] = await Promise.all([
      this.prisma.grade.findMany({
        where: { studentId },
        include: { submission: { include: { assignment: { select: { title: true } } } } },
        orderBy: { gradedAt: 'desc' },
      }),
      this.prisma.attendanceRecord.count({ where: { studentId } }),
      this.prisma.enrollment.findMany({
        where: { studentId },
        include: { course: { select: { title: true } } },
      }),
    ]);

    const averageGrade =
      grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : null;

    return {
      courses: enrollments.map((e) => e.course),
      averageGrade,
      recentGrades: grades.slice(0, 10),
      totalAttendanceCheckIns: attendanceCount,
    };
  }
}
