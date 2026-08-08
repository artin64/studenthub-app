import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('student/me')
  @Roles(Role.STUDENT)
  studentMe(@CurrentUser() user: AuthUser) {
    return this.analyticsService.studentOverview(user.id);
  }

  @Get('courses/:courseId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  course(@Param('courseId') courseId: string) {
    return this.analyticsService.courseOverview(courseId);
  }

  @Get('institution')
  @Roles(Role.ADMIN)
  institution() {
    return this.analyticsService.institutionOverview();
  }

  @Get('courses/:courseId/grades.csv')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="grades.csv"')
  gradesCsv(@Param('courseId') courseId: string) {
    return this.analyticsService.courseGradesCsv(courseId);
  }
}
