import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

interface ConversationSummary {
  user: { id: string; firstName: string; lastName: string };
  lastMessage: string;
  lastMessageAt: Date;
}

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  send(senderId: string, dto: SendMessageDto) {
    return this.prisma.message.create({
      data: { senderId, receiverId: dto.receiverId, content: dto.content },
    });
  }

  conversation(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async conversationsList(userId: string): Promise<ConversationSummary[]> {
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const seenIds = new Set<string>();
    const conversations: ConversationSummary[] = [];

    for (const m of messages) {
      const otherId = m.senderId === userId ? m.receiverId : m.senderId;
      if (seenIds.has(otherId)) continue;
      seenIds.add(otherId);
      const other = m.senderId === userId ? m.receiver : m.sender;
      conversations.push({ user: other, lastMessage: m.content, lastMessageAt: m.createdAt });
    }

    return conversations;
  }

  async markRead(userId: string, otherUserId: string) {
    await this.prisma.message.updateMany({
      where: { senderId: otherUserId, receiverId: userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}
