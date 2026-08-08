import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  createFaculty(dto: CreateFacultyDto) {
    return this.prisma.faculty.create({ data: { name: dto.name } });
  }

  createDepartment(facultyId: string, dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { name: dto.name, facultyId } });
  }

  listFaculties() {
    return this.prisma.faculty.findMany({
      include: { departments: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
