import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CourseAccessService } from '../common/access/course-access.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private courseAccess: CourseAccessService,
  ) {}

  async createSession(courseId: string, professorId: string, role: Role, dto: CreateSessionDto) {
    await this.courseAccess.assertCanManage(courseId, professorId, role);

    const durationMinutes = dto.durationMinutes ?? 15;
    const expiresAt = new Date(Date.now() + durationMinutes * 60_000);
    const qrToken = randomBytes(16).toString('hex');

    const session = await this.prisma.attendanceSession.create({
      data: { courseId, professorId, qrToken, expiresAt },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { studentId: true },
    });
    await this.notifications.createForMany(
      enrollments.map((e) => e.studentId),
      'ATTENDANCE_SESSION_OPENED',
      'Attendance is open',
      `Check in within ${durationMinutes} minutes.`,
    );

    return session;
  }

  async checkIn(studentId: string, qrToken: string) {
    const session = await this.prisma.attendanceSession.findUnique({ where: { qrToken } });
    if (!session) {
      throw new NotFoundException('Invalid QR code');
    }
    if (session.expiresAt < new Date()) {
      throw new BadRequestException('This QR code has expired');
    }
    // A code leaked outside the class shouldn't let an unenrolled student
    // check in — confirm they're actually in this course first.
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: session.courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course.');
    }

    return this.prisma.attendanceRecord.upsert({
      where: { sessionId_studentId: { sessionId: session.id, studentId } },
      update: {},
      create: { sessionId: session.id, studentId },
    });
  }

  async sessionAttendance(sessionId: string, userId: string, role: Role) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        records: { include: { student: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    await this.courseAccess.assertCanManage(session.courseId, userId, role);
    return session;
  }

  async studentAttendanceRate(studentId: string, courseId: string) {
    const totalSessions = await this.prisma.attendanceSession.count({ where: { courseId } });
    const attended = await this.prisma.attendanceRecord.count({
      where: { studentId, session: { courseId } },
    });
    const rate = totalSessions === 0 ? 0 : Math.round((attended / totalSessions) * 100);
    return { totalSessions, attended, rate };
  }
}
