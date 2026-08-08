import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Course isolation lives here.
 *
 * Every course-scoped module (assignments, exams, materials, forum, groups,
 * attendance) should call one of these before reading or writing
 * course-scoped data, instead of trusting the :courseId in the URL blindly.
 * This is what keeps one course's data from leaking into another: a student
 * only gets access to courses they are actively enrolled in, a professor
 * only to courses they teach, and ADMIN can see everything.
 */
@Injectable()
export class CourseAccessService {
  constructor(private prisma: PrismaService) {}

  /** Read access: enrolled student, teaching professor, or admin. */
  async assertCanView(courseId: string, userId: string, role: Role) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (role === Role.ADMIN) return course;
    if (course.professorId === userId) return course;
    if (role === Role.STUDENT) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId, courseId } },
      });
      if (enrollment) return course;
    }
    throw new ForbiddenException('You do not have access to this course');
  }

  /** Write access: only the professor who teaches the course, or admin. */
  async assertCanManage(courseId: string, userId: string, role: Role) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (role === Role.ADMIN) return course;
    if (course.professorId === userId) return course;
    throw new ForbiddenException('You do not teach this course');
  }

  /** Same rule as assertCanView, but returns a boolean instead of throwing —
   * for endpoints that want to show a reduced preview to non-members
   * instead of a hard 403 (e.g. course detail before enrolling). */
  async canView(courseId: string, userId: string, role: Role): Promise<boolean> {
    try {
      await this.assertCanView(courseId, userId, role);
      return true;
    } catch {
      return false;
    }
  }
}
