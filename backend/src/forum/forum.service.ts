import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CourseAccessService } from '../common/access/course-access.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

const AUTHOR_SELECT = { select: { id: true, firstName: true, lastName: true, role: true, profileImageUrl: true } };

@Injectable()
export class ForumService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private courseAccess: CourseAccessService,
  ) {}

  // A professor's / admin's own post is auto-approved (they don't need to
  // moderate themselves). Anything from a student goes to PENDING and is
  // invisible to the rest of the course until a professor approves it —
  // that's the "no public post without teacher acceptance" requirement.
  async createPost(courseId: string, authorId: string, role: Role, dto: CreatePostDto) {
    await this.courseAccess.assertCanView(courseId, authorId, role);
    const autoApproved = role === Role.PROFESSOR || role === Role.ADMIN;

    const post = await this.prisma.forumPost.create({
      data: {
        courseId,
        authorId,
        title: dto.title,
        content: dto.content,
        status: autoApproved ? PostStatus.APPROVED : PostStatus.PENDING,
      },
      include: { author: AUTHOR_SELECT },
    });

    if (!autoApproved) {
      const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { professorId: true, title: true } });
      if (course) {
        await this.notifications.create(
          course.professorId,
          'FORUM_POST_PENDING_REVIEW',
          'Postim i ri pret miratim',
          `Një postim i ri në "${course.title}" pret shqyrtimin tuaj.`,
        );
      }
    }

    return post;
  }

  async listForCourse(courseId: string, userId: string, role: Role) {
    await this.courseAccess.assertCanView(courseId, userId, role);
    return this.prisma.forumPost.findMany({
      where: {
        courseId,
        OR: [{ status: PostStatus.APPROVED }, { authorId: userId }],
      },
      include: { author: AUTHOR_SELECT, _count: { select: { replies: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPendingForCourse(courseId: string, userId: string, role: Role) {
    await this.courseAccess.assertCanManage(courseId, userId, role);
    return this.prisma.forumPost.findMany({
      where: { courseId, status: PostStatus.PENDING },
      include: { author: AUTHOR_SELECT },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approvePost(postId: string, userId: string, role: Role) {
    const post = await this.getOrThrow(postId);
    await this.courseAccess.assertCanManage(post.courseId, userId, role);
    const updated = await this.prisma.forumPost.update({
      where: { id: postId },
      data: { status: PostStatus.APPROVED, reviewedById: userId, reviewedAt: new Date(), rejectionReason: null },
    });
    await this.notifications.create(
      post.authorId,
      'FORUM_POST_APPROVED',
      'Postimi juaj u miratua',
      `Postimi juaj "${post.title}" tani është i dukshëm për të gjithë kursin.`,
    );
    return updated;
  }

  async rejectPost(postId: string, userId: string, role: Role, reason?: string) {
    const post = await this.getOrThrow(postId);
    await this.courseAccess.assertCanManage(post.courseId, userId, role);
    const updated = await this.prisma.forumPost.update({
      where: { id: postId },
      data: { status: PostStatus.REJECTED, reviewedById: userId, reviewedAt: new Date(), rejectionReason: reason ?? null },
    });
    await this.notifications.create(
      post.authorId,
      'FORUM_POST_REJECTED',
      'Postimi juaj u refuzua',
      reason ?? `Postimi juaj "${post.title}" nuk u miratua nga mësuesi.`,
    );
    return updated;
  }

  async getPost(postId: string, userId: string, role: Role) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: AUTHOR_SELECT,
        replies: { include: { author: AUTHOR_SELECT }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    await this.courseAccess.assertCanView(post.courseId, userId, role);
    if (post.status !== PostStatus.APPROVED && post.authorId !== userId) {
      const canManage = await this.courseAccess
        .assertCanManage(post.courseId, userId, role)
        .then(() => true)
        .catch(() => false);
      if (!canManage) {
        throw new ForbiddenException('This post is awaiting moderator approval.');
      }
    }
    return post;
  }

  async addReply(postId: string, authorId: string, role: Role, dto: CreateReplyDto) {
    const post = await this.getOrThrow(postId);
    await this.courseAccess.assertCanView(post.courseId, authorId, role);
    if (post.status !== PostStatus.APPROVED) {
      throw new ForbiddenException('You can only reply to an approved post.');
    }
    return this.prisma.forumReply.create({
      data: { postId, authorId, content: dto.content },
      include: { author: AUTHOR_SELECT },
    });
  }

  private async getOrThrow(postId: string) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }
}
