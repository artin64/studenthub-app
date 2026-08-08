import { Controller, Delete, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post('courses/:courseId/groups')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  create(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(courseId, user.id, user.role, dto);
  }

  @Get('courses/:courseId/groups')
  listForCourse(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string) {
    return this.groupsService.listForCourse(courseId, user.id, user.role);
  }

  @Post('groups/:id/join')
  @Roles(Role.STUDENT)
  join(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.groupsService.join(id, user.id);
  }

  @Delete('groups/:id/leave')
  @Roles(Role.STUDENT)
  leave(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.groupsService.leave(id, user.id);
  }
}
