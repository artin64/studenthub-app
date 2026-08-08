import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { LibraryService } from './library.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@ApiTags('library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('library')
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateResourceDto) {
    return this.libraryService.create(user.id, dto);
  }

  @Get()
  list() {
    return this.libraryService.list();
  }
}
