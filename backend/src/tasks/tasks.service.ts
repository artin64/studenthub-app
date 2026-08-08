import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface TaskItem {
  id: string;
  type: string;
  title: string;
  description: string;
  link: string;
  severity: 'info' | 'warning' | 'urgent';
}

const DAYS_AHEAD_FOR_DUE_SOON = 7;

// One place that answers "what's left for me to do" for whoever is
// looking — the shape of that answer is completely different for a
// student (assignments/exams/attendance) vs a professor (grading,
// moderation, approvals) vs an admin (platform-wide approvals). Nothing
// here is stored — it's computed fresh from existing tables each time.
@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async myTasks(userId: string, role: Role): Promise<TaskItem[]> {
    switch (role) {
      case Role.STUDENT:
        return this.studentTasks(userId);
      case Role.PROFESSOR:
        return this.professorTasks(userId);
      case Role.ADMIN:
        return this.adminTasks();
      case Role.PARENT:
        return this.parentTasks(userId);
      default:
        return [];
    }
  }

  private async studentTasks(studentId: string): Promise<TaskItem[]> {
    const soon = new Date(Date.now() + DAYS_AHEAD_FOR_DUE_SOON * 24 * 60 * 60 * 1000);
    const now = new Date();

    const [enrollments, submissions] = await Promise.all([
      this.prisma.enrollment.findMany({ where: { studentId, status: 'ACTIVE' }, select: { courseId: true } }),
      this.prisma.submission.findMany({ where: { studentId }, select: { assignmentId: true } }),
    ]);
    const courseIds = enrollments.map((e) => e.courseId);
    const submittedIds = new Set(submissions.map((s) => s.assignmentId));

    const [pendingAssignments, openExams, openSessions, checkIns] = await Promise.all([
      this.prisma.assignment.findMany({
        where: { courseId: { in: courseIds }, archivedAt: null, dueDate: { lte: soon } },
        include: { course: { select: { title: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.exam.findMany({
        where: { courseId: { in: courseIds }, status: 'PUBLISHED', archivedAt: null, startsAt: { lte: now }, endsAt: { gte: now } },
        include: { course: { select: { title: true } }, attempts: { where: { studentId }, select: { id: true, submittedAt: true } } },
      }),
      this.prisma.attendanceSession.findMany({
        where: { courseId: { in: courseIds }, expiresAt: { gte: now } },
        include: { course: { select: { title: true } } },
      }),
      this.prisma.attendanceRecord.findMany({ where: { studentId }, select: { sessionId: true } }),
    ]);
    const checkedInSessionIds = new Set(checkIns.map((c) => c.sessionId));

    const tasks: TaskItem[] = [];

    for (const a of pendingAssignments) {
      if (submittedIds.has(a.id)) continue;
      const overdue = a.dueDate < now;
      tasks.push({
        id: `assignment-${a.id}`,
        type: 'ASSIGNMENT_DUE',
        title: a.title,
        description: `${a.course.title} — ${overdue ? 'ka kaluar afati' : `afati: ${a.dueDate.toLocaleDateString()}`}`,
        link: `/app/courses`,
        severity: overdue ? 'urgent' : 'warning',
      });
    }

    for (const e of openExams) {
      const attempted = e.attempts.some((a) => a.submittedAt);
      if (attempted) continue;
      tasks.push({
        id: `exam-${e.id}`,
        type: 'EXAM_OPEN',
        title: e.title,
        description: `${e.course.title} — hapur deri ${e.endsAt.toLocaleString()}`,
        link: `/app/courses`,
        severity: 'urgent',
      });
    }

    for (const s of openSessions) {
      if (checkedInSessionIds.has(s.id)) continue;
      tasks.push({
        id: `attendance-${s.id}`,
        type: 'ATTENDANCE_OPEN',
        title: 'Kodi i pranisë është aktiv',
        description: `${s.course.title} — regjistrohu para ${s.expiresAt.toLocaleTimeString()}`,
        link: `/app/courses`,
        severity: 'info',
      });
    }

    return tasks;
  }

  private async professorTasks(professorId: string): Promise<TaskItem[]> {
    const courses = await this.prisma.course.findMany({ where: { professorId, archivedAt: null }, select: { id: true, title: true } });
    const courseIds = courses.map((c) => c.id);
    const courseTitle = new Map(courses.map((c) => [c.id, c.title]));

    const [assignments, pendingPosts, pendingLinks] = await Promise.all([
      this.prisma.assignment.findMany({
        where: { courseId: { in: courseIds }, archivedAt: null },
        include: { _count: { select: { submissions: true } }, submissions: { select: { grade: { select: { id: true } } } } },
      }),
      this.prisma.forumPost.findMany({
        where: { courseId: { in: courseIds }, status: 'PENDING' },
        select: { id: true, title: true, courseId: true },
      }),
      this.prisma.parentLink.findMany({
        where: { status: 'PENDING', student: { enrollments: { some: { course: { professorId } } } } },
        include: { parent: { select: { firstName: true, lastName: true } }, student: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const tasks: TaskItem[] = [];

    for (const a of assignments) {
      const ungraded = a.submissions.filter((s) => !s.grade).length;
      if (ungraded > 0) {
        tasks.push({
          id: `grade-${a.id}`,
          type: 'GRADING_PENDING',
          title: a.title,
          description: `${ungraded} dorëzim(e) presin vlerësim`,
          link: `/app/courses`,
          severity: 'warning',
        });
      }
    }

    for (const p of pendingPosts) {
      tasks.push({
        id: `post-${p.id}`,
        type: 'FORUM_MODERATION',
        title: p.title,
        description: `${courseTitle.get(p.courseId) ?? ''} — postim pret miratim`,
        link: `/app/courses`,
        severity: 'info',
      });
    }

    for (const l of pendingLinks) {
      tasks.push({
        id: `link-${l.id}`,
        type: 'PARENT_LINK_APPROVAL',
        title: `${l.parent.firstName} ${l.parent.lastName} → ${l.student.firstName} ${l.student.lastName}`,
        description: 'Kërkesë për lidhje prind–nxënës pret miratim',
        link: `/app/tasks`,
        severity: 'info',
      });
    }

    return tasks;
  }

  private async adminTasks(): Promise<TaskItem[]> {
    const [pendingUsers, pendingLinks, demoRequests] = await Promise.all([
      this.prisma.user.findMany({ where: { status: 'PENDING' }, select: { id: true, firstName: true, lastName: true, role: true } }),
      this.prisma.parentLink.count({ where: { status: 'PENDING' } }),
      this.prisma.demoRequest.count({ where: { contacted: false } }),
    ]);

    const tasks: TaskItem[] = pendingUsers.map((u) => ({
      id: `approval-${u.id}`,
      type: 'REGISTRATION_APPROVAL',
      title: `${u.firstName} ${u.lastName} (${u.role})`,
      description: 'Regjistrim i ri pret miratim',
      link: `/app/tasks`,
      severity: 'info' as const,
    }));

    if (pendingLinks > 0) {
      tasks.push({
        id: 'parent-links',
        type: 'PARENT_LINK_APPROVAL',
        title: `${pendingLinks} kërkesa prind–nxënës`,
        description: 'Presin miratim',
        link: `/app/tasks`,
        severity: 'info',
      });
    }
    if (demoRequests > 0) {
      tasks.push({
        id: 'demo-requests',
        type: 'DEMO_REQUEST',
        title: `${demoRequests} kërkesa për demo`,
        description: 'Nuk janë kontaktuar ende',
        link: `/app/tasks`,
        severity: 'info',
      });
    }

    return tasks;
  }

  private async parentTasks(parentId: string): Promise<TaskItem[]> {
    const pending = await this.prisma.parentLink.findMany({
      where: { parentId, status: 'PENDING' },
      include: { student: { select: { firstName: true, lastName: true } } },
    });
    return pending.map((l) => ({
      id: `link-${l.id}`,
      type: 'PARENT_LINK_PENDING',
      title: `${l.student.firstName} ${l.student.lastName}`,
      description: 'Kërkesa juaj për lidhje pret miratim nga mësuesi/administrata',
      link: `/app/parent`,
      severity: 'info' as const,
    }));
  }
}
