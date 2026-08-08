import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ParentService } from './parent.service';
import { LinkChildDto } from './dto/link-child.dto';
import { RejectLinkDto } from './dto/reject-link.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('parent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parent')
export class ParentController {
  constructor(private parentService: ParentService) {}

  @Post('children')
  @Roles(Role.PARENT)
  linkChild(@CurrentUser() user: AuthUser, @Body() dto: LinkChildDto) {
    return this.parentService.linkChild(user.id, dto.studentEmail);
  }

  @Get('children')
  @Roles(Role.PARENT)
  myChildren(@CurrentUser() user: AuthUser) {
    return this.parentService.myChildren(user.id);
  }

  @Get('children/requests')
  @Roles(Role.PARENT)
  myRequests(@CurrentUser() user: AuthUser) {
    return this.parentService.myPendingRequests(user.id);
  }

  @Get('children/:studentId/overview')
  @Roles(Role.PARENT)
  childOverview(@CurrentUser() user: AuthUser, @Param('studentId') studentId: string) {
    return this.parentService.childOverview(user.id, studentId);
  }

  // --- Approval queue: professor (only for their own students) or admin ---
  @Get('link-requests/pending')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  listPending(@CurrentUser() user: AuthUser) {
    return this.parentService.listPendingForApprover(user.id, user.role);
  }

  @Post('link-requests/:id/approve')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.parentService.approveLink(id, user.id, user.role);
  }

  @Post('link-requests/:id/reject')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  reject(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: RejectLinkDto) {
    return this.parentService.rejectLink(id, user.id, user.role, dto.reason);
  }
}
