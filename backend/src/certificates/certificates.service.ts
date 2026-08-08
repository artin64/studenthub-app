import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAccessService } from '../common/access/course-access.service';

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private courseAccess: CourseAccessService,
  ) {}

  async issue(courseId: string, issuedById: string, role: Role, studentId: string) {
    await this.courseAccess.assertCanManage(courseId, issuedById, role);
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('This student is not enrolled in the course.');
    }
    return this.prisma.certificate.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: {},
      create: { studentId, courseId, issuedById },
    });
  }

  listMine(studentId: string) {
    return this.prisma.certificate.findMany({
      where: { studentId },
      include: { course: { select: { title: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async listForCourse(courseId: string, userId: string, role: Role) {
    await this.courseAccess.assertCanManage(courseId, userId, role);
    return this.prisma.certificate.findMany({
      where: { courseId },
      include: { student: { select: { firstName: true, lastName: true } } },
    });
  }
}
