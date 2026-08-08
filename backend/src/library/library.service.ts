import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  create(addedById: string, dto: CreateResourceDto) {
    return this.prisma.libraryResource.create({
      data: {
        title: dto.title,
        author: dto.author,
        type: dto.type,
        link: dto.link,
        addedById,
      },
    });
  }

  list() {
    return this.prisma.libraryResource.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
