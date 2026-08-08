import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  send(@CurrentUser() user: { id: string }, @Body() dto: SendMessageDto) {
    return this.messagesService.send(user.id, dto);
  }

  @Get('conversations')
  conversations(@CurrentUser() user: { id: string }) {
    return this.messagesService.conversationsList(user.id);
  }

  @Get('with/:userId')
  conversation(@CurrentUser() user: { id: string }, @Param('userId') otherUserId: string) {
    return this.messagesService.conversation(user.id, otherUserId);
  }

  @Post('with/:userId/read')
  markRead(@CurrentUser() user: { id: string }, @Param('userId') otherUserId: string) {
    return this.messagesService.markRead(user.id, otherUserId);
  }
}
