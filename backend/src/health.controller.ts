import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  // If this doesn't respond, the backend process isn't running or isn't
  // reachable — that's step one of debugging any "Failed to fetch" in the
  // frontend. If this responds but database: false, the process is up but
  // can't reach Postgres (check DATABASE_URL and that Postgres is running).
  @Get()
  async check() {
    let database = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }
    return {
      status: database ? 'ok' : 'degraded',
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
