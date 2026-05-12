import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VictronAdapter } from '../../inverters/adapters/victron.adapters';
import { InverterModelAction } from '../../inverters/action/inverters.action';
import { InvertersMetrics } from '../../inverters-metrics/entities/inverters-metrics.entity';
import { MetricsPubSubService } from '../pubsub/metrics-pubsub.service';
import { SecretManager } from '../../../common/utils/crypto.util';
import { InverterBrand } from '../../../common/enums';
import { Inverter } from '../../inverters/entities/inverters.entity';
import { NormalisedMetric } from '../../inverters/types';

// Victron poll interval: 2 minutes (120,000 ms)
const VICTRON_POLL_INTERVAL_MS = 120_000;

@Injectable()
export class MetricsPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsPollerService.name);

  // Inverters loaded at startup — keyed by brand for easy extension later
  private victronInverters: Inverter[] = [];

  constructor(
    private readonly victronAdapter: VictronAdapter,
    private readonly inverterModelAction: InverterModelAction,
    @InjectRepository(InvertersMetrics)
    private readonly metricsRepo: Repository<InvertersMetrics>,
    private readonly pubSubService: MetricsPubSubService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadInverters();
  }

  // NestJS schedule handles cleanup of @Interval tasks on shutdown.
  onModuleDestroy(): void {
    this.logger.log('MetricsPollerService: shutting down');
  }

  @Interval(VICTRON_POLL_INTERVAL_MS)
  async pollVictron(): Promise<void> {
    if (!this.victronInverters.length) return;

    // Process each inverter independently — one failure must not block others
    await Promise.allSettled(
      this.victronInverters.map((inverter) => this.pollOne(inverter)),
    );
  }

  private async loadInverters(): Promise<void> {
    const inverters = await this.inverterModelAction.findAllVictron();

    this.victronInverters = inverters;

    if (!inverters.length) {
      this.logger.warn(
        'MetricsPollerService: no active Victron inverters found at startup — polling is a no-op until restart',
      );
      return;
    }

    this.logger.log(
      `MetricsPollerService: registered ${inverters.length} Victron inverter(s) for polling`,
    );
  }

  private async pollOne(inverter: Inverter): Promise<void> {
    // Decrypt credentials
    let accessToken: string;
    try {
      accessToken = SecretManager.decrypt(inverter.encryptedCredentials!);
    } catch (err) {
      this.logger.error(
        `MetricsPollerService: failed to decrypt credentials for inverter ${inverter.id}`,
        (err as Error).message,
      );
      return;
    }

    // Fetch metrics from Victron VRM API
    let metric: NormalisedMetric;
    try {
      metric = await this.victronAdapter.fetchMetrics(
        accessToken,
        inverter.installationId!,
        inverter.id,
      );
    } catch (err) {
      this.logger.error(
        `MetricsPollerService: fetch failed for inverter ${inverter.id} (${InverterBrand.VICTRON})`,
        (err as Error).message,
      );
      return; // skip DB write and Redis publish
    }

    // Persist snapshot to inverter_metrics
    try {
      await this.metricsRepo.save(
        this.metricsRepo.create({
          inverterId: metric.inverterId,
          solarGenKw: metric.solarPowerKw,
          batterySocPercent: metric.batterySoc,
          loadKw: metric.acOutputPowerKw,
          gridVoltageV: metric.gridVoltageV ?? undefined,
          gridFrequencyHz: metric.gridFrequencyHz ?? undefined,
          batteryVoltageV: metric.batteryVoltageV ?? undefined,
          batteryCurrentA: metric.batteryCurrentA ?? undefined,
          inverterStatus: metric.inverterStatus,
          batteryTemperatureC: metric.batteryTemperatureC ?? undefined,
          batteryTimeToGoMin: metric.batteryTimeToGoMin ?? undefined,
          inverterTemperatureC: metric.inverterTemperatureC ?? undefined,
          metricTimestamp: new Date(metric.recordedAt),
        }),
      );
    } catch (err) {
      this.logger.error(
        `MetricsPollerService: DB write failed for inverter ${inverter.id}`,
        (err as Error).message,
      );
      return; // skip daily upsert and Redis publish so no partial state
    }

    try {
      const channel = `inverter:${metric.inverterId}`;
      await this.pubSubService.publish(channel, JSON.stringify(metric));
    } catch (err) {
      this.logger.error(
        `MetricsPollerService: Redis publish failed for inverter ${inverter.id}`,
        (err as Error).message,
      );
      // DB write already succeeded - do not roll back
    }
  }
}
