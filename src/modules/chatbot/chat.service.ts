import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ModifyChatSettingsDTO } from './dto/modify-chat-settings.dto';
import { ChatModelAction } from './actions/chat.action';
import { UsersService } from '../users/users.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SYS_MSG } from '../../common/constants/sys-msg';
import type { ConfigType } from '@nestjs/config';
import { chatbotConfig } from '../../config/chatbot.config';
import { randomUUID } from 'node:crypto';
import { Chat } from './entities/chat.entity';
import { GetChatMessagesDto } from './dto/get-chat-messages.dto';
import { MessageModelAction } from './actions/message.action';
import { MessageContentType } from './helpers/content-type';
import { MessageDeliveryStatus } from './helpers/delivery-status';

@Injectable()
export class ChatService {
  constructor(
    @Inject(chatbotConfig.KEY)
    private readonly chatbotCfg: ConfigType<typeof chatbotConfig>,
    private readonly chatModelAction: ChatModelAction,
    private readonly messageModelAction: MessageModelAction,
    private readonly usersService: UsersService,
  ) {}

  async startChat(dto: StartChatDto) {
    if (dto.initiatorId !== dto.userId)
      throw new ConflictException(SYS_MSG.CONFLICT);

    await this.usersService.findOne(dto.userId);

    const chatPayload: Partial<Chat> = {
      contextLength: this.chatbotCfg.chatContextLength,
      expirationTimeoutSeconds: this.chatbotCfg.chatExpirationTimeoutSeconds,
      messages: [],
      roomId: randomUUID(),
      userId: dto.userId,
    };

    const chat = await this.chatModelAction.createChat(chatPayload);
    if (dto.startingMessage) {
      const message = await this.messageModelAction.saveMessage({
        chat,
        content: dto.startingMessage,
        contentType: MessageContentType.TEXT,
        deliveryStatus: MessageDeliveryStatus.DELIVERED,
        isTransitioning: false,
        senderId: dto.userId,
      });
      if (chat.messages) chat.messages.push(message);
      else chat.messages = [message];
    }
    return chat;
  }

  async getChatsForUser(userId: string) {
    await this.usersService.findOne(userId); // this is meant to throw an exception if the user is invalid
    const chats = await this.chatModelAction.findByUserId(userId);
    return chats;
  }

  async getChatMessages(dto: GetChatMessagesDto) {
    const chat = await this.chatModelAction.findById(dto.chatId);
    if (!chat) throw new NotFoundException(SYS_MSG.NOT_FOUND);

    if (chat.userId !== dto.userId)
      throw new UnauthorizedException(SYS_MSG.FORBIDDEN);

    return this.messageModelAction.findByChatId(chat.id);
  }

  getSingleChat(chatId: string) {
    return this.chatModelAction.findById(chatId);
  }

  getSuggestedChatQuestions() {}

  modifyChatSettings(chatId: string, dto: ModifyChatSettingsDTO) {
    /**
     * Steps to modify chat settings
     *
     * Ensure that a chat exists with the id exists
     * update the chat settings
     * return the updated chat to the user
     */
    return { chatId, dto };
  }

  async sendMessage() {
    /**
     * Steps to send a message
     *
     * throw an error if the chat does not exist
     * throw an error if the chat was not started by the user
     * save the message
     * [MAYBE] recreate chat context with last 10 messages
     * send message to LLM integration
     * return message to the sender
     */
  }
}
