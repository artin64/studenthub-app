import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async studentOverview(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const [grades, submissions, attendanceRecords, totalSessions] = await Promise.all([
      this.prisma.grade.findMany({ where: { studentId }, orderBy: { gradedAt: 'asc' } }),
      this.prisma.submission.count({ where: { studentId } }),
      this.prisma.attendanceRecord.count({ where: { studentId } }),
      this.prisma.attendanceSession.count({ where: { courseId: { in: courseIds } } }),
    ]);

    const averageGrade =
      grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : null;

    return {
      coursesEnrolled: enrollments.length,
      assignmentsSubmitted: submissions,
      averageGrade,
      attendanceRate: totalSessions === 0 ? null : Math.round((attendanceRecords / totalSessions) * 100),
      gradesOverTime: grades.map((g) => ({ date: g.gradedAt, score: g.score })),
    };
  }

  async courseOverview(courseId: string) {
    const [enrollments, assignmentsCount, submissionsCount, grades, sessionsCount, recordsCount] =
      await Promise.all([
        this.prisma.enrollment.findMany({
          where: { courseId },
          include: { student: { select: { id: true, firstName: true, lastName: true } } },
        }),
        this.prisma.assignment.count({ where: { courseId } }),
        this.prisma.submission.count({ where: { assignment: { courseId } } }),
        this.prisma.grade.findMany({ where: { submission: { assignment: { courseId } } } }),
        this.prisma.attendanceSession.count({ where: { courseId } }),
        this.prisma.attendanceRecord.count({ where: { session: { courseId } } }),
      ]);

    const averageGrade =
      grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : null;

    const expectedSubmissions = enrollments.length * assignmentsCount;
    const submissionRate =
      expectedSubmissions === 0 ? null : Math.round((submissionsCount / expectedSubmissions) * 100);

    const expectedAttendance = enrollments.length * sessionsCount;
    const attendanceRate =
      expectedAttendance === 0 ? null : Math.round((recordsCount / expectedAttendance) * 100);

    const students = await Promise.all(
      enrollments.map(async (e) => {
        const studentGrades = await this.prisma.grade.findMany({
          where: { studentId: e.studentId, submission: { assignment: { courseId } } },
        });
        const studentAttended = await this.prisma.attendanceRecord.count({
          where: { studentId: e.studentId, session: { courseId } },
        });
        const avg =
          studentGrades.length > 0
            ? Math.round(studentGrades.reduce((s, g) => s + g.score, 0) / studentGrades.length)
            : null;
        const attRate = sessionsCount === 0 ? null : Math.round((studentAttended / sessionsCount) * 100);
        return {
          student: e.student,
          averageGrade: avg,
          attendanceRate: attRate,
          atRisk: (avg !== null && avg < 60) || (attRate !== null && attRate < 60),
        };
      }),
    );

    return {
      enrollmentsCount: enrollments.length,
      assignmentsCount,
      averageGrade,
      submissionRate,
      attendanceRate,
      students,
    };
  }

  async institutionOverview() {
    const roles: Role[] = ['STUDENT', 'PROFESSOR', 'ADMIN', 'PARENT'];
    const usersByRole = await Promise.all(
      roles.map(async (role) => ({ role, count: await this.prisma.user.count({ where: { role } }) })),
    );

    const [coursesCount, gradesAgg, sessionsCount, recordsCount] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.grade.aggregate({ _avg: { score: true }, _count: true }),
      this.prisma.attendanceSession.count(),
      this.prisma.attendanceRecord.count(),
    ]);

    return {
      usersByRole,
      coursesCount,
      averageGrade: gradesAgg._avg.score !== null ? Math.round(gradesAgg._avg.score) : null,
      gradesRecorded: gradesAgg._count,
      attendanceSessionsCount: sessionsCount,
      attendanceCheckIns: recordsCount,
    };
  }

  async courseGradesCsv(courseId: string) {
    const grades = await this.prisma.grade.findMany({
      where: { submission: { assignment: { courseId } } },
      include: {
        student: { select: { firstName: true, lastName: true, email: true } },
        submission: { include: { assignment: { select: { title: true } } } },
      },
    });

    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = 'Student,Email,Assignment,Score,Graded At\n';
    const rows = grades
      .map((g) =>
        [
          escape(`${g.student.firstName} ${g.student.lastName}`),
          escape(g.student.email),
          escape(g.submission.assignment.title),
          escape(g.score),
          escape(g.gradedAt.toISOString()),
        ].join(','),
      )
      .join('\n');

    return header + rows;
  }
}
