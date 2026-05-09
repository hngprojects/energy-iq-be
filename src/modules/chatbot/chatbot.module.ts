import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotGateway } from './chatbot.gateway';
import { ChatbotController } from './chatbot.controller';

@Module({
  providers: [ChatbotGateway, ChatbotService],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
