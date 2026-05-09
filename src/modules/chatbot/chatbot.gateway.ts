import { WebSocketGateway } from '@nestjs/websockets';
import { ChatbotService } from './chatbot.service';

@WebSocketGateway()
export class ChatbotGateway {
  constructor(private readonly chatbotService: ChatbotService) {}
}
