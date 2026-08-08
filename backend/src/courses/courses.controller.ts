import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(user.id, dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.coursesService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
      departmentId,
    });
  }

  @Get('mine')
  @Roles(Role.STUDENT)
  myCourses(@CurrentUser() user: AuthUser) {
    return this.coursesService.myCourses(user.id);
  }

  @Get('ects/mine')
  @Roles(Role.STUDENT)
  myEcts(@CurrentUser() user: AuthUser) {
    return this.coursesService.myEcts(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.coursesService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, user.id, user.role, dto);
  }

  // Soft delete (archive) — see courses.service.ts. Real course data is
  // never destroyed by this endpoint.
  @Delete(':id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.coursesService.remove(id, user.id, user.role);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  restore(@Param('id') id: string) {
    return this.coursesService.restore(id);
  }

  @Post(':id/enroll')
  @Roles(Role.STUDENT)
  enroll(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.coursesService.enroll(user.id, id);
  }

  @Post(':id/complete/:studentId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  markComplete(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.coursesService.markComplete(id, studentId);
  }
}
