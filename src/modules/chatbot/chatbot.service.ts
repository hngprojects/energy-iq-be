import { ConflictException, Injectable } from '@nestjs/common';
import { ModifyChatSettingsDTO } from './dto/modify-chat-settings.dto';
import { ChatModelAction } from './actions/chat.action';
import { UsersService } from '../users/users.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SYS_MSG } from '../../common/constants/sys-msg';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly chatModelAction: ChatModelAction,
    private readonly usersService: UsersService,
  ) {}

  startChat(dto: StartChatDto) {
    /**
     * create a chat with this user id
     */
    if (dto.initiatorId !== dto.userId)
      throw new ConflictException(SYS_MSG.CONFLICT);
    return null;
  }

  async getChatsForUser(userId: string) {
    await this.usersService.findOne(userId); // this is meant to throw an exception if the user is invalid
    const chats = await this.chatModelAction.findByUserId(userId);
    return chats;
  }

  getChatMessages(chatId: string) {
    /**
     * Steps to get chat messages
     *
     * Throw an error if no chat exists with the provided chat id
     * Throw an error if the user id property of the chat doesn't equal the user id of the caller
     * get all the messages with with the given chat id, paginated and ordered in descending order of date
     * return messages
     */
    return chatId;
  }

  getSingleChat(chatId: string) {
    return chatId;
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
