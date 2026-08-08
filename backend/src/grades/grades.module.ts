import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';

@Module({
  imports: [NotificationsModule],
  providers: [GradesService],
  controllers: [GradesController],
})
export class GradesModule {}
