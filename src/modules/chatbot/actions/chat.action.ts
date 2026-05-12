import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { Chat } from '../entities/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChatModelAction extends AbstractModelAction<Chat> {
  constructor(
    @InjectRepository(Chat)
    repository: Repository<Chat>,
  ) {
    super(repository, Chat);
  }

  async createChat(chat: { contextLength: number; expTimeout: number }) {
    return this.create({
      createPayload: chat,
      transactionOptions: {
        useTransaction: false,
      },
    });
  }

  findById(id: string): Promise<Chat | null> {
    return this.get({ identifierOptions: { id } });
  }

  async findByUserId(userId: string): Promise<Chat[]> {
    const result = await this.find({
      findOptions: {
        userId,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });
    return result.payload;
  }
}
