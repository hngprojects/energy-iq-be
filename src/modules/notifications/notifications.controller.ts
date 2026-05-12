import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import {
  NotificationResponseDto,
  PaginatedNotificationResponseDto,
} from './dto/notification-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * GET /api/v1/notifications
   * Returns paginated notifications for the current user.
   * Optionally filter by ?isRead=false or ?isRead=true
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get notifications for current user',
    description:
      'Returns paginated notifications filtered by the authenticated user. Use ?isRead=false to get only unread notifications.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: PaginatedNotificationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: { id: string },
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.findAllForUser(
      user.id,
      query,
    );
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * IMPORTANT: This route MUST be defined before /:id/read
   * Otherwise 'read-all' would be matched as an :id parameter
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description:
      'Marks all unread notifications for the current user as read in a single database operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      example: {
        success: true,
        message: 'All notifications marked as read',
        data: { updated: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Marks a single notification as read.
   * Only the owner of the notification can mark it as read.
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a single notification as read',
    description:
      'Marks the notification with the given ID as read. Returns 404 if the notification does not belong to the current user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markOneAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markOneAsRead(id, user.id);
  }
}