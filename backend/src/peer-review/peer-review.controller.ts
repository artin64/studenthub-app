import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { PeerReviewService } from './peer-review.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('peer-review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('submissions/:submissionId/reviews')
export class PeerReviewController {
  constructor(private peerReviewService: PeerReviewService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(
    @CurrentUser() user: { id: string },
    @Param('submissionId') submissionId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.peerReviewService.create(submissionId, user.id, dto);
  }

  @Get()
  forSubmission(@Param('submissionId') submissionId: string) {
    return this.peerReviewService.forSubmission(submissionId);
  }
}
