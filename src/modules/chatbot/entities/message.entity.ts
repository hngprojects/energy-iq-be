import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../database/entities/abstract-base.entity';
import { Chat } from './chat.entity';

@Entity('messages')
export class Message extends AbstractBaseEntity {
  @ManyToOne(() => Chat, (chat) => chat.messages, {
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  chat: Chat;

  @Column({ type: 'longtext', default: '' })
  content: string;

  @Column({ type: 'longtext', length: '' })
  deliveryStatus: string;

  @Column({ type: 'varchar', length: '50' })
  senderId: string; // for messages sent by the system, this value will be the text 'system' and for messages sent by the user, its value will be the user's id
}
