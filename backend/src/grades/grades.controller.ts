import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('grades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class GradesController {
  constructor(private gradesService: GradesService) {}

  @Post('submissions/:id/grade')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  grade(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateGradeDto) {
    return this.gradesService.gradeSubmission(id, user.id, user.role, dto);
  }

  @Get('grades/mine')
  @Roles(Role.STUDENT)
  myGrades(@CurrentUser() user: AuthUser) {
    return this.gradesService.myGrades(user.id);
  }
}
