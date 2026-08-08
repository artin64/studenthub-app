import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { NotificationType, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  bio: true,
  profileImageUrl: true,
  createdAt: true,
};

const MAX_PAGE_SIZE = 100;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // Paginated + optionally filtered/searched. Admins manage potentially
  // 100k+ accounts — a plain findMany() with no limit would try to load
  // every single user into one response, which gets slow and eventually
  // falls over well before you reach that many rows.
  async findAll(opts: { page?: number; pageSize?: number; search?: string; role?: Role; status?: UserStatus }) {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, opts.pageSize ?? 25));

    const where = {
      role: opts.role,
      status: opts.status,
      ...(opts.search
        ? {
            OR: [
              { firstName: { contains: opts.search, mode: 'insensitive' as const } },
              { lastName: { contains: opts.search, mode: 'insensitive' as const } },
              { email: { contains: opts.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: PUBLIC_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: { firstName: dto.firstName, lastName: dto.lastName, bio: dto.bio },
      select: PUBLIC_SELECT,
    });
  }

  async updatePhoto(id: string, publicPath: string) {
    return this.prisma.user.update({
      where: { id },
      data: { profileImageUrl: publicPath },
      select: PUBLIC_SELECT,
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    // Bump tokenVersion: changing your password from Settings also signs
    // out every other device/session using the old token, same as a reset.
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    return { success: true };
  }

  updateAlumniStatus(id: string, isAlumnus: boolean, alumniCompany?: string, alumniRole?: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isAlumnus, alumniCompany, alumniRole },
      select: { id: true, isAlumnus: true, alumniCompany: true, alumniRole: true },
    });
  }

  listAlumni() {
    return this.prisma.user.findMany({
      where: { isAlumnus: true },
      select: { id: true, firstName: true, lastName: true, alumniCompany: true, alumniRole: true, profileImageUrl: true },
    });
  }

  // -----------------------------------------------------------------
  // Registration approval queue
  // -----------------------------------------------------------------

  /** A professor can only see/approve STUDENT and PARENT requests. Admin sees everything. */
  async listPending(requesterRole: Role, roleFilter?: Role) {
    const allowedRoles: Role[] =
      requesterRole === Role.ADMIN ? [Role.STUDENT, Role.PARENT, Role.PROFESSOR, Role.COMPANY] : [Role.STUDENT, Role.PARENT];

    const role = roleFilter && allowedRoles.includes(roleFilter) ? roleFilter : undefined;

    return this.prisma.user.findMany({
      where: { status: UserStatus.PENDING, role: role ?? { in: allowedRoles } },
      select: { ...PUBLIC_SELECT },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(targetId: string, approverId: string, approverRole: Role) {
    const target = await this.getPendingTargetOrThrow(targetId, approverRole);

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { status: UserStatus.ACTIVE, approvedById: approverId, approvedAt: new Date(), rejectionReason: null },
      select: PUBLIC_SELECT,
    });

    await this.prisma.notification.create({
      data: {
        userId: targetId,
        type: NotificationType.REGISTRATION_APPROVED,
        title: 'Llogaria u aktivizua',
        body: 'Llogaria juaj u miratua. Tani mund të hyni në platformë.',
      },
    });
    await this.mail.send(
      target.email,
      'Llogaria juaj u aktivizua — StudentHub',
      'Llogaria juaj u miratua nga një mësues ose administrator. Tani mund të hyni në platformë.',
    );

    return updated;
  }

  async reject(targetId: string, approverRole: Role, reason?: string) {
    const target = await this.getPendingTargetOrThrow(targetId, approverRole);

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { status: UserStatus.REJECTED, rejectionReason: reason ?? null },
      select: PUBLIC_SELECT,
    });

    await this.prisma.notification.create({
      data: {
        userId: targetId,
        type: NotificationType.REGISTRATION_REJECTED,
        title: 'Kërkesa për llogari u refuzua',
        body: reason ?? 'Kërkesa juaj për llogari u refuzua.',
      },
    });
    await this.mail.send(
      target.email,
      'Kërkesa juaj — StudentHub',
      `Kërkesa juaj për llogari u refuzua.${reason ? ` Arsyeja: ${reason}` : ''} Nëse mendoni se ky është gabim, kontaktoni administratën.`,
    );

    return updated;
  }

  private async getPendingTargetOrThrow(targetId: string, approverRole: Role) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.status !== UserStatus.PENDING) {
      throw new BadRequestException('This account is not pending approval.');
    }
    const professorCanApprove = target.role === Role.STUDENT || target.role === Role.PARENT;
    if (approverRole === Role.PROFESSOR && !professorCanApprove) {
      throw new ForbiddenException('Only an admin can approve professor or company accounts.');
    }
    return target;
  }

  // -----------------------------------------------------------------
  // Admin: suspend / reactivate (immediate — kicks out active sessions)
  // -----------------------------------------------------------------

  async suspend(targetId: string) {
    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { status: UserStatus.SUSPENDED, tokenVersion: { increment: 1 } },
      select: PUBLIC_SELECT,
    });
    return updated;
  }

  async reactivate(targetId: string) {
    return this.prisma.user.update({
      where: { id: targetId },
      data: { status: UserStatus.ACTIVE },
      select: PUBLIC_SELECT,
    });
  }
}
