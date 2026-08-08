import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCvDto } from './dto/update-cv.dto';

@Injectable()
export class CvService {
  constructor(private prisma: PrismaService) {}

  async getMine(studentId: string) {
    const [cv, user, portfolio, certificates, enrollments] = await Promise.all([
      this.prisma.cvProfile.findUnique({ where: { studentId } }),
      this.prisma.user.findUnique({
        where: { id: studentId },
        select: { firstName: true, lastName: true, email: true },
      }),
      this.prisma.portfolioItem.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.certificate.findMany({
        where: { studentId },
        include: { course: { select: { title: true } } },
      }),
      this.prisma.enrollment.findMany({
        where: { studentId },
        include: { course: { select: { title: true } } },
      }),
    ]);

    return {
      user,
      summary: cv?.summary ?? null,
      skills: cv?.skills ?? null,
      portfolio,
      certificates,
      courses: enrollments.map((e) => e.course),
    };
  }

  upsert(studentId: string, dto: UpdateCvDto) {
    return this.prisma.cvProfile.upsert({
      where: { studentId },
      update: { summary: dto.summary, skills: dto.skills },
      create: { studentId, summary: dto.summary, skills: dto.skills },
    });
  }
}
