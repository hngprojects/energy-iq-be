import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsAction } from './actions/notifications.action';
import { NotificationQueryDto } from './dto/notification-query.dto';
import {
  PublicNotification,
  PaginatedNotifications,
} from './types/notification.type';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsAction: NotificationsAction,
  ) {}

  /**
   * Get paginated notifications for a specific user.
   * Optionally filter by read status.
   * Always ordered newest first.
   */
  async findAllForUser(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedNotifications> {
    const { page = 1, limit = 20, isRead } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    // Only apply isRead filter if explicitly provided
    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.is_read = :isRead', { isRead });
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      data: notifications.map((n) => this.toPublicNotification(n)),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Mark a single notification as read.
   * Idempotent — calling this on an already-read notification
   * returns the current state without changing readAt.
   */
  async markOneAsRead(id: string, userId: string): Promise<PublicNotification> {
    const notification = await this.notificationsAction.findOneByIdAndUserId(
      id,
      userId,
    );

    // Idempotency check — do not update readAt if already read
    if (notification.isRead) {
      return this.toPublicNotification(notification);
    }

    const updated = await this.notificationsAction.markAsRead(notification);

    return this.toPublicNotification(updated);
  }

  /**
   * Mark all unread notifications as read for a user.
   * Single database query regardless of notification count.
   */
  async markAllAsRead(userId: string): Promise<{ updated: boolean }> {
    await this.notificationsAction.markAllAsRead(userId);
    return { updated: true };
  }

  /**
   * Convert internal entity to public-facing object.
   * Never expose more fields than necessary.
   */
  private toPublicNotification(notification: Notification): PublicNotification {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
