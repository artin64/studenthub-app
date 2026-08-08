import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses/:courseId/materials')
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Post()
  @Roles(Role.PROFESSOR, Role.ADMIN)
  create(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string, @Body() dto: CreateMaterialDto) {
    return this.materialsService.create(courseId, user.id, user.role, dto);
  }

  @Get()
  listForCourse(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string) {
    return this.materialsService.listForCourse(courseId, user.id, user.role);
  }
}
