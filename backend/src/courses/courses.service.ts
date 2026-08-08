import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAccessService } from '../common/access/course-access.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private courseAccess: CourseAccessService,
  ) {}

  create(professorId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        professorId,
        departmentId: dto.departmentId,
        ectsCredits: dto.ectsCredits,
      },
      include: { department: { include: { faculty: true } } },
    });
  }

  // Catalog: safe to show to anyone (browsing decides whether to enroll),
  // deliberately light — no assignments/materials here. Bounded + optional
  // search/department filter so this stays fast as the course count grows
  // toward what 100k students across every school in Kosovo implies.
  async findAll(opts: { page?: number; pageSize?: number; search?: string; departmentId?: string }) {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, opts.pageSize ?? 50));

    const where = {
      archivedAt: null,
      departmentId: opts.departmentId,
      ...(opts.search ? { title: { contains: opts.search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          professor: { select: { id: true, firstName: true, lastName: true } },
          department: { include: { faculty: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.course.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  // Full detail (with assignments) only for enrolled students, the
  // teaching professor, or admin — that's the course-isolation boundary.
  // Everyone else gets the same light preview as the catalog, so browsing
  // to decide whether to enroll still works.
  async findOne(id: string, userId: string, role: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        professor: { select: { id: true, firstName: true, lastName: true, bio: true, profileImageUrl: true } },
        department: { include: { faculty: true } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const fullAccess = await this.courseAccess.canView(id, userId, role);
    if (!fullAccess) {
      return { ...course, assignments: [], restricted: true };
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId: id, archivedAt: null },
      orderBy: { dueDate: 'asc' },
    });
    return { ...course, assignments, restricted: false };
  }

  async update(id: string, userId: string, role: Role, dto: UpdateCourseDto) {
    await this.courseAccess.assertCanManage(id, userId, role);
    return this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        departmentId: dto.departmentId,
        ectsCredits: dto.ectsCredits,
      },
      include: { department: { include: { faculty: true } } },
    });
  }

  // Soft delete ONLY. This never runs a SQL DELETE — enrollments, grades,
  // certificates and attendance history tied to this course must survive
  // no matter what. Archived courses just stop showing up in the catalog
  // and can no longer accept new enrollments; an admin can restore().
  async remove(id: string, userId: string, role: Role) {
    await this.courseAccess.assertCanManage(id, userId, role);
    await this.prisma.course.update({ where: { id }, data: { archivedAt: new Date() } });
    return { success: true, archived: true };
  }

  async restore(id: string) {
    await this.prisma.course.update({ where: { id }, data: { archivedAt: null } });
    return { success: true, archived: false };
  }

  async enroll(studentId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.archivedAt) {
      throw new BadRequestException('This course is no longer accepting enrollments.');
    }
    return this.prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: {},
      create: { studentId, courseId },
    });
  }

  async myCourses(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: { course: { include: { department: { include: { faculty: true } } } } },
    });
  }

  markComplete(courseId: string, studentId: string) {
    return this.prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: { status: 'COMPLETED' },
    });
  }

  async myEcts(studentId: string) {
    const [completed, inProgress] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { studentId, status: 'COMPLETED' },
        include: { course: { select: { ectsCredits: true } } },
      }),
      this.prisma.enrollment.findMany({
        where: { studentId, status: 'ACTIVE' },
        include: { course: { select: { ectsCredits: true } } },
      }),
    ]);

    return {
      earned: completed.reduce((sum, e) => sum + e.course.ectsCredits, 0),
      inProgress: inProgress.reduce((sum, e) => sum + e.course.ectsCredits, 0),
    };
  }
}
