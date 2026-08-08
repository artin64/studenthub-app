import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseAccessService } from '../common/access/course-access.service';
import { CreateMaterialDto } from './dto/create-material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    private prisma: PrismaService,
    private courseAccess: CourseAccessService,
  ) {}

  async create(courseId: string, addedById: string, role: Role, dto: CreateMaterialDto) {
    await this.courseAccess.assertCanManage(courseId, addedById, role);
    return this.prisma.courseMaterial.create({
      data: { courseId, addedById, title: dto.title, url: dto.url },
    });
  }

  async listForCourse(courseId: string, userId: string, role: Role) {
    await this.courseAccess.assertCanView(courseId, userId, role);
    return this.prisma.courseMaterial.findMany({ where: { courseId }, orderBy: { createdAt: 'desc' } });
  }
}
