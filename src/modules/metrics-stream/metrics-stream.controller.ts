import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { MetricsStreamService } from './metrics-stream.service';
import type { Request, Response } from 'express';

@ApiTags('Metrics Stream')
@ApiBearerAuth()
@Controller({ path: 'inverters', version: '1' })
export class MetricsStreamController {
  constructor(private readonly metricsStreamService: MetricsStreamService) {}

  /**
   * GET /api/v1/inverters/:inverterId/metrics/stream
   */
  @Get(':inverterId/metrics/stream')
  @ApiOperation({ summary: 'Stream live metrics for an inverter via SSE' })
  @ApiResponse({
    status: 200,
    description: 'SSE stream opened. Events are sent as text/event-stream.',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid token.' })
  @ApiResponse({ status: 403, description: 'User does not own this inverter.' })
  @ApiResponse({ status: 404, description: 'Inverter not found.' })
  async streamMetrics(
    @Param('inverterId', ParseUUIDPipe) inverterId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: unknown,
    @Res() res: unknown,
  ): Promise<void> {
    await this.metricsStreamService.findInverterForUser(
      inverterId,
      currentUser.sub,
    );

    await this.metricsStreamService.streamMetrics(
      inverterId,
      req as Request,
      res as Response,
    );
  }
}
