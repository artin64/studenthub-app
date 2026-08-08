import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CheckInDto } from './dto/check-in.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('courses/:courseId/attendance/sessions')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  createSession(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string, @Body() dto: CreateSessionDto) {
    return this.attendanceService.createSession(courseId, user.id, user.role, dto);
  }

  @Post('attendance/check-in')
  @Roles(Role.STUDENT)
  checkIn(@CurrentUser() user: AuthUser, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(user.id, dto.qrToken);
  }

  @Get('attendance/sessions/:sessionId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  sessionAttendance(@CurrentUser() user: AuthUser, @Param('sessionId') sessionId: string) {
    return this.attendanceService.sessionAttendance(sessionId, user.id, user.role);
  }

  @Get('courses/:courseId/attendance/me')
  @Roles(Role.STUDENT)
  myAttendance(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string) {
    return this.attendanceService.studentAttendanceRate(user.id, courseId);
  }
}
