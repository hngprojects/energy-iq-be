import { Controller, Get, Patch } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chats')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get()
  getChatsForUser() {
    // TODO: This guy will return all the chats by user id
  }

  @Get()
  getChatMessages() {}

  @Get()
  getSingleChat() {}

  @Patch()
  modifyChatSettings() {}
}
