import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class PeerReviewService {
  constructor(private prisma: PrismaService) {}

  async create(submissionId: string, reviewerId: string, dto: CreateReviewDto) {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return this.prisma.peerReview.upsert({
      where: { submissionId_reviewerId: { submissionId, reviewerId } },
      update: { rating: dto.rating, comment: dto.comment },
      create: { submissionId, reviewerId, rating: dto.rating, comment: dto.comment },
    });
  }

  forSubmission(submissionId: string) {
    return this.prisma.peerReview.findMany({
      where: { submissionId },
      include: { reviewer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
