import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CertificatesService } from './certificates.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

interface AuthUser {
  id: string;
  role: Role;
}

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Post('courses/:courseId/certificates')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  issue(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string, @Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(courseId, user.id, user.role, dto.studentId);
  }

  @Get('certificates/mine')
  @Roles(Role.STUDENT)
  mine(@CurrentUser() user: AuthUser) {
    return this.certificatesService.listMine(user.id);
  }

  @Get('courses/:courseId/certificates')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  forCourse(@CurrentUser() user: AuthUser, @Param('courseId') courseId: string) {
    return this.certificatesService.listForCourse(courseId, user.id, user.role);
  }
}
