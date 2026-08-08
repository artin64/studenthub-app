import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ForumService } from './forum.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { RejectPostDto } from './dto/reject-post.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('forum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ForumController {
  constructor(private forumService: ForumService) {}

  @Post('courses/:courseId/forum')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  createPost(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string, @Body() dto: CreatePostDto) {
    return this.forumService.createPost(courseId, user.id, user.role, dto);
  }

  @Get('courses/:courseId/forum')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  listForCourse(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string) {
    return this.forumService.listForCourse(courseId, user.id, user.role);
  }

  @Get('courses/:courseId/forum/pending')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  listPending(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string) {
    return this.forumService.listPendingForCourse(courseId, user.id, user.role);
  }

  @Post('forum/:postId/approve')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  approve(@CurrentUser() user: AuthUser, @Param('postId') postId: string) {
    return this.forumService.approvePost(postId, user.id, user.role);
  }

  @Post('forum/:postId/reject')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  reject(@CurrentUser() user: AuthUser, @Param('postId') postId: string, @Body() dto: RejectPostDto) {
    return this.forumService.rejectPost(postId, user.id, user.role, dto.reason);
  }

  @Get('forum/:postId')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  getPost(@CurrentUser() user: AuthUser, @Param('postId') postId: string) {
    return this.forumService.getPost(postId, user.id, user.role);
  }

  @Post('forum/:postId/replies')
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.ADMIN)
  addReply(@CurrentUser() user: AuthUser, @Param('postId') postId: string, @Body() dto: CreateReplyDto) {
    return this.forumService.addReply(postId, user.id, user.role, dto);
  }
}
