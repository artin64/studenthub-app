import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';

@Injectable()
export class DemoRequestsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDemoRequestDto) {
    return this.prisma.demoRequest.create({ data: dto });
  }

  list() {
    return this.prisma.demoRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
  }

  markContacted(id: string) {
    return this.prisma.demoRequest.update({ where: { id }, data: { contacted: true } });
  }
}
