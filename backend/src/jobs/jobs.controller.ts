import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ApplyJobDto } from './dto/apply-job.dto';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @Roles(Role.COMPANY)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user.id, dto);
  }

  @Get()
  listAll() {
    return this.jobsService.listAll();
  }

  @Get('mine')
  @Roles(Role.COMPANY)
  mine(@CurrentUser() user: { id: string }) {
    return this.jobsService.listMine(user.id);
  }

  @Get('applications/mine')
  @Roles(Role.STUDENT)
  myApplications(@CurrentUser() user: { id: string }) {
    return this.jobsService.myApplications(user.id);
  }

  @Post(':id/apply')
  @Roles(Role.STUDENT)
  apply(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: ApplyJobDto) {
    return this.jobsService.apply(id, user.id, dto);
  }

  @Get(':id/applicants')
  @Roles(Role.COMPANY)
  applicants(@Param('id') id: string) {
    return this.jobsService.applicants(id);
  }
}
