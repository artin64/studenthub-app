import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';

@ApiTags('portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('portfolio')
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreatePortfolioItemDto) {
    return this.portfolioService.create(user.id, dto);
  }

  @Get('mine')
  @Roles(Role.STUDENT)
  mine(@CurrentUser() user: { id: string }) {
    return this.portfolioService.listForStudent(user.id);
  }

  @Get('student/:studentId')
  forStudent(@Param('studentId') studentId: string) {
    return this.portfolioService.listForStudent(studentId);
  }

  @Delete(':id')
  @Roles(Role.STUDENT)
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.portfolioService.remove(user.id, id);
  }
}
