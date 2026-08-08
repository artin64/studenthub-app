import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';

@Module({
  imports: [NotificationsModule],
  providers: [ForumService],
  controllers: [ForumController],
})
export class ForumModule {}
