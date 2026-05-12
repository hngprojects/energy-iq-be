// Mock the pubsub service before any imports resolve the ESM chain
jest.mock('../pubsub/metrics-pubsub.service');
jest.mock('../../../config/redis.config', () => ({
  redisConfig: { KEY: 'redis' },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MetricsStreamService } from '../metrics-stream.service';
import { MetricsPubSubService } from '../pubsub/metrics-pubsub.service';
import { InvertersService } from '../../inverters/inverters.service';
import { InvertersMetrics } from '../../inverters-metrics/entities/inverters-metrics.entity';

describe('MetricsStreamService', () => {
  let service: MetricsStreamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsStreamService,
        {
          provide: InvertersService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: MetricsPubSubService,
          useValue: {
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            once: jest.fn(),
            removeListener: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(InvertersMetrics),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MetricsStreamService>(MetricsStreamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
