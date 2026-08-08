import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAccessService } from '../common/access/course-access.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private courseAccess: CourseAccessService,
  ) {}

  async create(courseId: string, userId: string, role: Role, dto: CreateGroupDto) {
    await this.courseAccess.assertCanManage(courseId, userId, role);
    return this.prisma.projectGroup.create({ data: { courseId, name: dto.name } });
  }

  async listForCourse(courseId: string, userId: string, role: Role) {
    await this.courseAccess.assertCanView(courseId, userId, role);
    return this.prisma.projectGroup.findMany({
      where: { courseId },
      include: {
        members: { include: { student: { select: { id: true, firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async join(groupId: string, studentId: string) {
    const group = await this.prisma.projectGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: group.courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course.');
    }
    return this.prisma.groupMember.upsert({
      where: { groupId_studentId: { groupId, studentId } },
      update: {},
      create: { groupId, studentId },
    });
  }

  async leave(groupId: string, studentId: string) {
    await this.prisma.groupMember.deleteMany({ where: { groupId, studentId } });
    return { success: true };
  }
}
