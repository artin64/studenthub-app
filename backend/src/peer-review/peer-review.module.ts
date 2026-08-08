import { Module } from '@nestjs/common';
import { PeerReviewService } from './peer-review.service';
import { PeerReviewController } from './peer-review.controller';

@Module({
  providers: [PeerReviewService],
  controllers: [PeerReviewController],
})
export class PeerReviewModule {}
