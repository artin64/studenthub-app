import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  private async computeXp(studentId: string) {
    const [submissions, grades, attendanceCount, examAttempts] = await Promise.all([
      this.prisma.submission.count({ where: { studentId } }),
      this.prisma.grade.findMany({ where: { studentId }, select: { score: true } }),
      this.prisma.attendanceRecord.count({ where: { studentId } }),
      this.prisma.examAttempt.count({ where: { studentId, submittedAt: { not: null } } }),
    ]);
    const gradeXp = grades.reduce((sum, g) => sum + Math.round(g.score / 10), 0);
    return submissions * 10 + gradeXp + attendanceCount * 5 + examAttempts * 15;
  }

  private levelFor(xp: number) {
    if (xp >= 500) return 'Expert';
    if (xp >= 250) return 'Advanced';
    if (xp >= 100) return 'Intermediate';
    return 'Beginner';
  }

  async myXp(studentId: string) {
    const xp = await this.computeXp(studentId);
    return { xp, level: this.levelFor(xp) };
  }

  async leaderboard() {
    const students = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, firstName: true, lastName: true },
    });
    const withXp = await Promise.all(students.map(async (s) => ({ ...s, xp: await this.computeXp(s.id) })));
    return withXp.sort((a, b) => b.xp - a.xp).slice(0, 20);
  }
}
