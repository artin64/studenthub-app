import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  create(studentId: string, dto: CreatePortfolioItemDto) {
    return this.prisma.portfolioItem.create({
      data: { studentId, title: dto.title, description: dto.description, link: dto.link },
    });
  }

  listForStudent(studentId: string) {
    return this.prisma.portfolioItem.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
  }

  async remove(studentId: string, id: string) {
    const item = await this.prisma.portfolioItem.findUnique({ where: { id } });
    if (!item || item.studentId !== studentId) {
      throw new NotFoundException('Portfolio item not found');
    }
    await this.prisma.portfolioItem.delete({ where: { id } });
    return { success: true };
  }
}
