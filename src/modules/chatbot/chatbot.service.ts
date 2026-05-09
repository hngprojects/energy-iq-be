import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatbotService {
  async createChat() {}

  async getChatsForUser() {}

  async getChatMessages() {
    /**
     * Steps to get chat messages
     *
     * Throw an error if no chat exists with the provided chat id
     * Throw an error if the user id property of the chat doesn't equal the user id of the caller
     * get all the messages with with the given chat id, paginated and ordered in descending order of date
     * return messages
     */
  }

  async getSingleChat() {}

  async modifyChatSettings() {
    /**
     * Steps to modify chat settings
     *
     * Ensure that a chat exists with the id exists
     * update the chat settings
     * return the updated chat to the user
     */
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
