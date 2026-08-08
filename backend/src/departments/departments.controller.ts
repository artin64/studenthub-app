import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { DepartmentsService } from './departments.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Post('faculties')
  @Roles(Role.ADMIN)
  createFaculty(@Body() dto: CreateFacultyDto) {
    return this.departmentsService.createFaculty(dto);
  }

  @Post('faculties/:facultyId/departments')
  @Roles(Role.ADMIN)
  createDepartment(@Param('facultyId') facultyId: string, @Body() dto: CreateDepartmentDto) {
    return this.departmentsService.createDepartment(facultyId, dto);
  }

  @Get('faculties')
  listFaculties() {
    return this.departmentsService.listFaculties();
  }
}
