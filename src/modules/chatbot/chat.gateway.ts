import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { ChatSocketEvents } from './helpers/events';
import { Socket } from 'socket.io';
import { RejoinRoomsDto } from './dto/rejoin-rooms.dto';
import { ChatMessageDto } from './dto/chat-message.dto';

@WebSocketGateway({ namespace: 'agent' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatbotService: ChatService) {}

  async handleConnection(socket: Socket) {
    await this.chatbotService.joinActiveChatRooms(socket, {
      userId: socket.handshake.query.user_id as string,
    });
  }

  handleDisconnect(socket: Socket) {
    socket._cleanup();
  }

  @SubscribeMessage(ChatSocketEvents.JOIN_ACTIVE_CHATS)
  async rejoinActiveChatRooms(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: RejoinRoomsDto,
  ) {
    await this.chatbotService.joinActiveChatRooms(socket, dto);
  }

  @SubscribeMessage(ChatSocketEvents.SEND_MESSAGE)
  sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: ChatMessageDto,
  ) {
    console.log('received message', dto);
    return this.chatbotService.sendMessage(socket, dto);
  }
}
