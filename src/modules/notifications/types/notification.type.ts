import { NotificationType } from '../entities/notification.entity';

export interface PublicNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface PaginatedNotifications {
  data: PublicNotification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
