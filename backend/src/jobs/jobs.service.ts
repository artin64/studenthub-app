import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ApplyJobDto } from './dto/apply-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  create(companyId: string, dto: CreateJobDto) {
    return this.prisma.jobListing.create({
      data: { companyId, title: dto.title, description: dto.description, location: dto.location },
    });
  }

  listAll() {
    return this.prisma.jobListing.findMany({
      include: {
        company: { select: { firstName: true, lastName: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listMine(companyId: string) {
    return this.prisma.jobListing.findMany({
      where: { companyId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  apply(jobId: string, studentId: string, dto: ApplyJobDto) {
    return this.prisma.jobApplication.upsert({
      where: { jobId_studentId: { jobId, studentId } },
      update: {},
      create: { jobId, studentId, message: dto.message },
    });
  }

  applicants(jobId: string) {
    return this.prisma.jobApplication.findMany({
      where: { jobId },
      include: { student: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { appliedAt: 'desc' },
    });
  }

  myApplications(studentId: string) {
    return this.prisma.jobApplication.findMany({
      where: { studentId },
      include: { job: { include: { company: { select: { firstName: true, lastName: true } } } } },
    });
  }
}
