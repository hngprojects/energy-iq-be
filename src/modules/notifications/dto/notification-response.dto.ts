import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Notification UUID',
  })
  id: string;

  @ApiProperty({
    example: 'Battery Low',
    description: 'Short notification title',
  })
  title: string;

  @ApiProperty({
    example: 'Your battery is at 20%. Consider reducing load.',
    description: 'Full notification message',
  })
  message: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.BATTERY_LOW,
    description: 'Notification type',
  })
  type: NotificationType;

  @ApiProperty({
    example: false,
    description: 'Whether the notification has been read',
  })
  isRead: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Timestamp when notification was marked as read',
  })
  readAt: Date | null;

  @ApiProperty({
    example: '2026-05-12T05:00:00.000Z',
    description: 'When the notification was created',
  })
  createdAt: Date;
}

export class PaginatedNotificationResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data: NotificationResponseDto[];

  @ApiProperty({
    example: {
      total: 45,
      page: 1,
      limit: 20,
      hasNext: true,
      hasPrev: false,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}