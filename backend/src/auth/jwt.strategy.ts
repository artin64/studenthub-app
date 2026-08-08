import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
  type: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
    });
  }

  // Runs on every authenticated request. Deliberately hits the database
  // instead of trusting the token payload alone, so that suspending a
  // user or resetting their password takes effect immediately — not just
  // once their current token happens to expire on its own.
  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token i pavlefshëm.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, tokenVersion: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Sesioni ka skaduar. Ju lutem hyni përsëri.');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Llogaria juaj nuk është aktive.');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
