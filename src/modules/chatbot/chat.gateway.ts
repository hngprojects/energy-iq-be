import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { ChatbotSocketEvents } from './helpers/events';

@WebSocketGateway({ namespace: 'agent' })
export class ChatGateway implements OnGatewayConnection {
  constructor(private readonly chatbotService: ChatService) {}

  handleConnection(client: { id: string }) {
    console.log('user with id', client.id, 'has connected to the socket');
  }

  @SubscribeMessage(ChatbotSocketEvents.SEND_MESSAGE)
  sendMessage() {
    return this.chatbotService.sendMessage();
  }
}
