import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsAction {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Find a single notification that belongs to a specific user.
   * Always filter by both id AND userId for ownership validation.
   * A user must never access another user's notification.
   */
  async findOneByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification not found`);
    }

    return notification;
  }

  /**
   * Mark a single notification as read.
   * Sets isRead to true and records the exact timestamp.
   */
  async markAsRead(notification: Notification): Promise<Notification> {
    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  /**
   * Mark all unread notifications for a user as read.
   * Uses a single UPDATE query instead of fetching and saving each one.
   * This is critical for performance when a user has many notifications.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where('user_id = :userId AND is_read = false', { userId })
      .execute();
  }
}
