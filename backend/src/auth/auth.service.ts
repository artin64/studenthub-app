import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { NotificationType, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFactorDto } from './dto/verify-2fa.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateStaffDto } from './dto/create-staff.dto';

const TWO_FACTOR_TTL_MINUTES = 10;
const RESET_TOKEN_TTL_MINUTES = 60;

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  bio: true,
  profileImageUrl: true,
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  // ---------------------------------------------------------------------
  // Registration — every self-registered account starts PENDING and is
  // useless (cannot log in at all) until a professor or admin approves it.
  // ---------------------------------------------------------------------
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      // Because email is @unique on User and a user has exactly one `role`
      // column, one email can never hold two roles at once — this check is
      // the whole enforcement, at both the application layer (here) and
      // the database layer (the unique constraint itself, which would
      // reject a race-condition double-submit even if this check somehow
      // passed twice at once).
      throw new ConflictException('This email is already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        status: UserStatus.PENDING,
      },
      select: PUBLIC_USER_SELECT,
    });

    // Notify admins there's something to approve. Not professors too — with
    // potentially hundreds of professors, emailing/notifying all of them on
    // every single signup would be noise at scale. Any professor can still
    // see and act on the pending list (GET /users/pending), they just don't
    // get pushed a notification for each one; admins do.
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
      select: { id: true, email: true },
    });
    await Promise.all(
      admins.map((admin) =>
        this.prisma.notification.create({
          data: {
            userId: admin.id,
            type: NotificationType.REGISTRATION_SUBMITTED,
            title: 'Regjistrim i ri për miratim',
            body: `${user.firstName} ${user.lastName} (${dto.role}) kërkoi llogari dhe pret miratim.`,
          },
        }),
      ),
    );

    return {
      message: 'Kërkesa u dërgua. Llogaria aktivizohet pasi të miratohet nga një mësues ose administrator.',
      status: user.status,
    };
  }

  // ---------------------------------------------------------------------
  // Admin/professor creates a pre-approved staff account directly.
  // ---------------------------------------------------------------------
  async createStaff(dto: CreateStaffDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('This email is already registered.');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        status: UserStatus.ACTIVE,
      },
      select: PUBLIC_USER_SELECT,
    });
  }

  // ---------------------------------------------------------------------
  // Login step 1: verify password, then email a 2FA code instead of
  // handing back a token immediately.
  // ---------------------------------------------------------------------
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Email ose fjalëkalim i pasaktë.');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email ose fjalëkalim i pasaktë.');
    }

    this.assertLoginAllowed(user.status);

    const code = crypto.randomInt(100000, 999999).toString();
    const twoFactorCodeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + TWO_FACTOR_TTL_MINUTES * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCodeHash, twoFactorCodeExpiresAt: expiresAt },
    });

    await this.mail.send(
      user.email,
      'Kodi juaj i verifikimit — StudentHub',
      `Kodi juaj i hyrjes është: ${code}\n\nSkadon pas ${TWO_FACTOR_TTL_MINUTES} minutash. Nëse s'e keni kërkuar këtë hyrje, shpërfilleni këtë email.`,
    );

    return { requiresTwoFactor: true, email: user.email };
  }

  // ---------------------------------------------------------------------
  // Login step 2: verify the emailed code, issue tokens.
  // ---------------------------------------------------------------------
  async verifyTwoFactor(dto: VerifyTwoFactorDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.twoFactorCodeHash || !user.twoFactorCodeExpiresAt) {
      throw new UnauthorizedException('Kodi i pavlefshëm ose ka skaduar. Provoni hyrjen përsëri.');
    }
    if (user.twoFactorCodeExpiresAt < new Date()) {
      throw new UnauthorizedException('Kodi ka skaduar. Provoni hyrjen përsëri.');
    }
    const valid = await bcrypt.compare(dto.code, user.twoFactorCodeHash);
    if (!valid) {
      throw new UnauthorizedException('Kod i pasaktë.');
    }

    this.assertLoginAllowed(user.status);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCodeHash: null, twoFactorCodeExpiresAt: null, lastLoginAt: new Date() },
      select: { ...PUBLIC_USER_SELECT, tokenVersion: true },
    });

    return this.issueSession(updated);
  }

  // ---------------------------------------------------------------------
  // Refresh: exchange a still-valid refresh token for a new access token.
  // ---------------------------------------------------------------------
  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: string; tokenVersion: number; type: string };
    try {
      payload = this.jwt.verify(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret-change-me',
      });
    } catch {
      throw new UnauthorizedException('Sesioni ka skaduar. Ju lutem hyni përsëri.');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token i pavlefshëm.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { ...PUBLIC_USER_SELECT, tokenVersion: true },
    });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      // tokenVersion mismatch = password was reset or account was
      // suspended since this refresh token was issued.
      throw new UnauthorizedException('Sesioni ka skaduar. Ju lutem hyni përsëri.');
    }
    this.assertLoginAllowed(user.status);

    return this.issueSession(user);
  }

  // ---------------------------------------------------------------------
  // Forgot / reset password.
  // ---------------------------------------------------------------------
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Always the same response whether or not the email exists — otherwise
    // this endpoint becomes a way to check which emails have accounts.
    const genericResponse = {
      message: 'Nëse ky email ekziston në sistem, do të merrni udhëzime për rivendosjen e fjalëkalimit.',
    };
    if (!user) return genericResponse;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const passwordResetTokenHash = await bcrypt.hash(rawToken, 10);
    const passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetTokenHash, passwordResetExpiresAt },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(user.email)}&token=${rawToken}`;
    await this.mail.send(
      user.email,
      'Rivendosja e fjalëkalimit — StudentHub',
      `Për të rivendosur fjalëkalimin tuaj, hapni këtë lidhje (skadon pas ${RESET_TOKEN_TTL_MINUTES} minutash):\n${resetLink}\n\nNëse s'e keni kërkuar këtë, shpërfilleni këtë email — fjalëkalimi juaj mbetet i pandryshuar.`,
    );

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
      throw new UnauthorizedException('Lidhja e pavlefshme ose ka skaduar.');
    }
    if (user.passwordResetExpiresAt < new Date()) {
      throw new UnauthorizedException('Lidhja ka skaduar. Kërkoni një lidhje të re.');
    }
    const valid = await bcrypt.compare(dto.token, user.passwordResetTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Lidhja e pavlefshme.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        // Kicks out any session logged in before this reset — see
        // tokenVersion note on the schema and in jwt.strategy.ts.
        tokenVersion: { increment: 1 },
      },
    });

    return { message: 'Fjalëkalimi u ndryshua. Tani mund të hyni me fjalëkalimin e ri.' };
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------
  private assertLoginAllowed(status: UserStatus) {
    if (status === UserStatus.PENDING) {
      throw new ForbiddenException('Llogaria juaj pret miratim nga një mësues ose administrator.');
    }
    if (status === UserStatus.REJECTED) {
      throw new ForbiddenException('Kërkesa juaj për llogari u refuzua. Kontaktoni administratën.');
    }
    if (status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Llogaria juaj është pezulluar. Kontaktoni administratën.');
    }
  }

  private issueSession(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    status: UserStatus;
    bio: string | null;
    profileImageUrl: string | null;
    tokenVersion: number;
  }) {
    const basePayload = { sub: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion };

    const accessToken = this.jwt.sign(
      { ...basePayload, type: 'access' },
      { expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '2h' },
    );
    const refreshToken = this.jwt.sign(
      { ...basePayload, type: 'refresh' },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret-change-me',
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d',
      },
    );

    const { tokenVersion, ...publicUser } = user;
    return { accessToken, refreshToken, user: publicUser };
  }
}
