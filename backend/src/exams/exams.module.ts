import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';

@Module({
  imports: [NotificationsModule],
  providers: [ExamsService],
  controllers: [ExamsController],
})
export class ExamsModule {}
