import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  Inject,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import * as Redis from 'ioredis';
import { EventEmitter } from 'events';
import { redisConfig } from '../../../config/redis.config';

@Injectable()
export class MetricsPubSubService
  extends EventEmitter
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MetricsPubSubService.name);

  private publisher: Redis.Redis;
  private subscriber: Redis.Redis;
  private readonly subscriptions = new Map<
    string,
    Set<(message: string) => void>
  >();

  constructor(
    @Inject(redisConfig.KEY)
    private readonly redisCfg: ConfigType<typeof redisConfig>,
  ) {
    super();
  }

  onModuleInit(): void {
    this.publisher = this.createClient('publisher');
    this.subscriber = this.createClient('subscriber');

    // Route incoming pub/sub messages to the registered callback for that channel.
    this.subscriber.on('message', (channel: string, message: string) => {
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.forEach((cb) => cb(message));
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
    this.logger.log('MetricsPubSubService: Redis clients closed');
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    this.subscriptions.get(channel)!.add(callback);
  }

  async unsubscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    const callbacks = this.subscriptions.get(channel);
    if (callbacks) {
      callbacks.delete(callback);
      // Only unsubscribe from Redis when no more listeners remain for this channel
      if (callbacks.size === 0) {
        this.subscriptions.delete(channel);
        await this.subscriber.unsubscribe(channel);
      }
    }
  }

  private createClient(role: 'publisher' | 'subscriber'): Redis.Redis {
    const client = new Redis.Redis({
      host: this.redisCfg.redisHost,
      port: this.redisCfg.redisPort,
      db: this.redisCfg.redisDefaultDb, // we use default db here
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    client.on('connect', () => {
      this.logger.log(`MetricsPubSubService: ${role} connected`);
    });

    client.on('error', (error: Error) => {
      this.logger.error(`MetricsPubSubService: ${role} error`, error.message);

      // Re-emit on the service instance only for the subscriber so the SSE
      // controller can listen for 'error' and close the stream gracefully.
      if (role === 'subscriber') {
        this.emit('error', error);
      }
    });

    return client;
  }
}
