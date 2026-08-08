import { Module } from '@nestjs/common';
import { DemoRequestsService } from './demo-requests.service';
import { DemoRequestsController } from './demo-requests.controller';

@Module({
  providers: [DemoRequestsService],
  controllers: [DemoRequestsController],
})
export class DemoRequestsModule {}
