// Mock the pubsub service before any imports resolve the ESM chain
jest.mock('../pubsub/metrics-pubsub.service');
jest.mock('../../../config/redis.config', () => ({
  redisConfig: { KEY: 'redis' },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { MetricsStreamController } from '../metrics-stream.controller';
import { MetricsStreamService } from '../metrics-stream.service';

describe('MetricsStreamController', () => {
  let controller: MetricsStreamController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsStreamController],
      providers: [
        {
          provide: MetricsStreamService,
          useValue: {
            findInverterForUser: jest.fn(),
            streamMetrics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MetricsStreamController>(MetricsStreamController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
