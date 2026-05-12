import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request, Response } from 'express';
import { InvertersService } from '../inverters/inverters.service';
import { MetricsPubSubService } from './pubsub/metrics-pubsub.service';
import { InvertersMetrics } from '../inverters-metrics/entities/inverters-metrics.entity';
import { toMetricEvent } from './serializer/metric-event.serializer';
import { NormalisedMetric } from '../inverters/types';

@Injectable()
export class MetricsStreamService {
  private readonly logger = new Logger(MetricsStreamService.name);

  constructor(
    private readonly invertersService: InvertersService,
    private readonly pubSubService: MetricsPubSubService,
    @InjectRepository(InvertersMetrics)
    private readonly metricsRepo: Repository<InvertersMetrics>,
  ) {}

  /**
   * Verifies the requesting user owns the inverter.
   * Delegates to InvertersService (service-to-service).
   * Throws NotFoundException (from InvertersService) or ForbiddenException.
   */
  async findInverterForUser(inverterId: string, userId: string) {
    const inverter = await this.invertersService.findOne(inverterId);
    if (inverter.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this inverter stream.',
      );
    }
    return inverter;
  }

  /**
   * Opens an SSE stream for the given inverter.
   * Ownership must be verified before calling this method.
   *
   * Lifecycle:
   *  1. Set SSE headers and flush
   *  2. Send latest DB snapshot immediately
   *  3. Subscribe to Redis channel for live events
   *  4. Send heartbeat every 30 s
   *  5. Handle Redis errors gracefully
   *  6. Clean up on client disconnect
   */
  async streamMetrics(
    inverterId: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    // Step 1 — SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const channel = `inverter:${inverterId}`;

    // Step 2 — Initial snapshot
    try {
      const latest = await this.metricsRepo.findOne({
        where: { inverterId },
        order: { metricTimestamp: 'DESC' },
      });

      if (latest) {
        const snapshot: NormalisedMetric = {
          inverterId: latest.inverterId,
          recordedAt: latest.metricTimestamp.toISOString(),
          batterySoc: Number(latest.batterySocPercent),
          solarPowerKw: Number(latest.solarGenKw),
          acOutputPowerKw: Number(latest.loadKw),
          gridVoltageV: Number(latest.gridVoltageV ?? 0),
          gridFrequencyHz: Number(latest.gridFrequencyHz ?? 0),
          inverterStatus: latest.inverterStatus ?? 'unknown',
          batteryVoltageV:
            latest.batteryVoltageV != null
              ? Number(latest.batteryVoltageV)
              : null,
          batteryCurrentA:
            latest.batteryCurrentA != null
              ? Number(latest.batteryCurrentA)
              : null,
          batteryTemperatureC:
            latest.batteryTemperatureC != null
              ? Number(latest.batteryTemperatureC)
              : null,
          batteryTimeToGoMin:
            latest.batteryTimeToGoMin != null
              ? Number(latest.batteryTimeToGoMin)
              : null,
          inverterTemperatureC:
            latest.inverterTemperatureC != null
              ? Number(latest.inverterTemperatureC)
              : null,
        };
        res.write(
          `event: metric_update\ndata: ${JSON.stringify(toMetricEvent(snapshot))}\n\n`,
        );
      }
    } catch (err) {
      this.logger.error(
        `MetricsStreamService: failed to fetch initial snapshot for inverter ${inverterId}`,
        (err as Error).message,
      );
      // Non-fatal — proceed to subscribe even if snapshot fails
    }

    // Step 3 — Subscribe to Redis channel
    const onMessage = (message: string): void => {
      try {
        const metric = JSON.parse(message) as NormalisedMetric;
        res.write(
          `event: metric_update\ndata: ${JSON.stringify(toMetricEvent(metric))}\n\n`,
        );
      } catch (err) {
        this.logger.error(
          `MetricsStreamService: failed to parse message on channel ${channel}`,
          (err as Error).message,
        );
      }
    };

    await this.pubSubService.subscribe(channel, onMessage);

    // Step 4 — Heartbeat
    const heartbeat = setInterval(() => {
      res.write(':\n\n');
    }, 30_000);

    // Step 5 — Redis error → close stream gracefully
    const onRedisError = (err: Error): void => {
      this.logger.error(
        `MetricsStreamService: Redis subscriber error for inverter ${inverterId}`,
        err.message,
      );
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: 'stream_error' })}\n\n`,
      );
      res.end();
    };
    this.pubSubService.once('error', onRedisError);

    // Step 6 — Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      this.pubSubService.removeListener('error', onRedisError);
      void this.pubSubService.unsubscribe(channel, onMessage);
      this.logger.log(
        `MetricsStreamService: client disconnected from inverter ${inverterId} stream`,
      );
    });
  }
}
