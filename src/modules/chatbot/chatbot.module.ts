import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { UsersModule } from '../users/users.module';
import { ChatModelAction } from './actions/chat.action';
import { MessageModelAction } from './actions/message.action';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { ChatbotService } from './chatbot.service';

@Module({
  providers: [
    ChatbotService,
    ChatGateway,
    ChatService,
    ChatModelAction,
    MessageModelAction,
  ],
  controllers: [ChatController],
  imports: [TypeOrmModule.forFeature([Chat, Message]), UsersModule],
})
export class ChatbotModule {}
