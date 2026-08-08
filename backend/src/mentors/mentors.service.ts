import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// "Mentors": a directory of professors so students/parents can see who's
// teaching, their bio/photo, and what they teach — separate from the
// admin-only full user record.
@Injectable()
export class MentorsService {
  constructor(private prisma: PrismaService) {}

  async list(search?: string) {
    const professors = await this.prisma.user.findMany({
      where: {
        role: 'PROFESSOR',
        status: 'ACTIVE',
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        bio: true,
        profileImageUrl: true,
        coursesTaught: {
          where: { archivedAt: null },
          select: { id: true, title: true, department: { select: { name: true } } },
        },
      },
      orderBy: { firstName: 'asc' },
      take: 200,
    });
    return professors;
  }

  async detail(id: string) {
    return this.prisma.user.findFirst({
      where: { id, role: 'PROFESSOR', status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        bio: true,
        profileImageUrl: true,
        coursesTaught: {
          where: { archivedAt: null },
          select: { id: true, title: true, description: true, _count: { select: { enrollments: true } } },
        },
      },
    });
  }
}
