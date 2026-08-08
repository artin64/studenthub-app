import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

// @Global so every module can inject MailService without re-importing it
// everywhere (auth, parent, forum, users, tasks all need it).
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
