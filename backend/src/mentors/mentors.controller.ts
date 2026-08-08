import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MentorsService } from './mentors.service';

@ApiTags('mentors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mentors')
export class MentorsController {
  constructor(private mentorsService: MentorsService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.mentorsService.list(search);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.mentorsService.detail(id);
  }
}
