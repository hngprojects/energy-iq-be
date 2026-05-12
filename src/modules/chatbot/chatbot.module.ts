import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotGateway } from './chatbot.gateway';
import { ChatbotController } from './chatbot.controller';
import { UsersModule } from '../users/users.module';

@Module({
  providers: [ChatbotGateway, ChatbotService],
  controllers: [ChatbotController],
  imports: [UsersModule],
})
export class ChatbotModule {}
