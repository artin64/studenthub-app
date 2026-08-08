import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';

@Module({
  imports: [NotificationsModule],
  providers: [ParentService],
  controllers: [ParentController],
})
export class ParentModule {}
