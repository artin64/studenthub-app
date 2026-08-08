import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CvService } from './cv.service';
import { UpdateCvDto } from './dto/update-cv.dto';

@ApiTags('cv')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cv')
export class CvController {
  constructor(private cvService: CvService) {}

  @Get('mine')
  @Roles(Role.STUDENT)
  mine(@CurrentUser() user: { id: string }) {
    return this.cvService.getMine(user.id);
  }

  @Patch('mine')
  @Roles(Role.STUDENT)
  update(@CurrentUser() user: { id: string }, @Body() dto: UpdateCvDto) {
    return this.cvService.upsert(user.id, dto);
  }
}
