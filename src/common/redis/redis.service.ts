import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  Inject,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import * as Redis from 'ioredis';
import { redisConfig } from '../../config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public redisClient: Redis.Redis;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly redisConfiguration: ConfigType<typeof redisConfig>,
  ) {}

  onModuleInit() {
    this.logger.log('Connecting to Redis (DB 1)...');

    this.redisClient = new Redis.Redis({
      host: this.redisConfiguration.redisHost,
      port: this.redisConfiguration.redisPort,
      db: 1,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis client connected (DB 1)');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('Redis client error:', error);
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
    this.logger.log('Redis client closed (DB 1)');
  }

  /**
   * get(key, unique)
   *
   * key: this is the unique key used to store a value in redis (email)
   * unique: this is a unique group that a key belong to (otp, verify)
   */
  async get(key: string, unique: string): Promise<string | null> {
    return await this.redisClient.get(
      `${unique.toLowerCase()}:${key.toLowerCase()}`,
    ); //
  }

  /**
   * set(key, value, unique)
   *
   * key: this is the unique key used to store a value in redis (email)
   * value: this is the value being stored in redis (012345) e.g. the otp 6 digits
   * unique: this is a unique group that a key belong to (otp, verify)
   * ttl: this is the amount of time it takes before the value expires (it's calculated in seconds)
   */
  async set(
    key: string,
    value: string,
    unique: string,
    ttl?: number,
  ): Promise<void> {
    if (ttl) {
      await this.redisClient.set(
        `${unique.toLowerCase()}:${key.toLowerCase()}`,
        value,
        'EX',
        ttl,
      );
    } else {
      await this.redisClient.set(
        `${unique.toLowerCase()}:${key.toLowerCase()}`,
        value,
      );
    }
  }

  /**
   * delete(key, unique)
   *
   * key: this is the unique key used to store a value in redis (email)
   * unique: this is a unique group that a key belong to (otp, verify)
   */
  async delete(key: string, unique: string): Promise<void> {
    await this.redisClient.del(`${unique.toLowerCase()}:${key.toLowerCase()}`);
  }
}
