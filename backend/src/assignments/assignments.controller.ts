import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Post('courses/:courseId/assignments')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Param('courseId') courseId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(courseId, user.id, user.role, dto);
  }

  @Get('courses/:courseId/assignments')
  findForCourse(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string) {
    return this.assignmentsService.findForCourse(courseId, user.id, user.role);
  }

  @Patch('assignments/:id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.assignmentsService.update(id, user.id, user.role, dto);
  }

  @Delete('assignments/:id')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assignmentsService.remove(id, user.id, user.role);
  }

  @Post('assignments/:id/submit')
  @Roles(Role.STUDENT)
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SubmitAssignmentDto) {
    return this.assignmentsService.submit(id, user.id, dto);
  }

  @Get('assignments/:id/submissions')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  findSubmissions(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assignmentsService.findSubmissions(id, user.id, user.role);
  }

  @Get('assignments/:id/peer-submissions')
  @Roles(Role.STUDENT)
  peerSubmissions(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assignmentsService.peerSubmissions(id, user.id);
  }
}
