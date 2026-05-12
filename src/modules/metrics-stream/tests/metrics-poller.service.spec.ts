import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';

// jest.mock calls are hoisted by Jest before any imports are resolved.
// We mock the entire pubsub service module AND the redis config it depends on
// to prevent Jest from trying to parse @t3-oss/env-core (ESM-only).
jest.mock('../pubsub/metrics-pubsub.service');
jest.mock('../../../config/redis.config', () => ({
  redisConfig: {
    KEY: 'redis',
  },
}));

import { MetricsPollerService } from '../poller/metrics-poller.service';
import { VictronAdapter } from '../../inverters/adapters/victron.adapters';
import { InverterModelAction } from '../../inverters/action/inverters.action';
import { InvertersMetrics } from '../../inverters-metrics/entities/inverters-metrics.entity';
import { MetricsPubSubService } from '../pubsub/metrics-pubsub.service';
import { SecretManager } from '../../../common/utils/crypto.util';
import { VrmApiException } from '../types/vrm-api-exception';
import { NormalisedMetric } from '../../inverters/types';
import { Inverter } from '../../inverters/entities/inverters.entity';
import { InverterBrand, InverterApiType } from '../../../common/enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInverter(overrides: Partial<Inverter> = {}): Inverter {
  return {
    id: 'inv-uuid-1',
    userId: 'user-uuid-1',
    brand: InverterBrand.VICTRON,
    apiType: InverterApiType.LIVE_API,
    isActive: true,
    installationId: 'site-123',
    encryptedCredentials: 'encrypted-token',
    model: 'Cerbo GX',
    serialNumber: 'SN001',
    ratedCapacityKwh: 10,
    panelCapacityKw: 5,
    lastSyncedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    metrics: [],
    user: undefined as unknown as Inverter['user'],
    ...overrides,
  };
}

function makeMetric(inverterId = 'inv-uuid-1'): NormalisedMetric {
  return {
    inverterId,
    recordedAt: new Date().toISOString(),
    batterySoc: 80,
    solarPowerKw: 2.5,
    acOutputPowerKw: 2.0,
    gridVoltageV: 230,
    gridFrequencyHz: 50,
    inverterStatus: 'normal',
    batteryVoltageV: 52.4,
    batteryCurrentA: 10.2,
    batteryTemperatureC: 28,
    batteryTimeToGoMin: 120,
    inverterTemperatureC: 35,
  };
}

// fast-check arbitrary for NormalisedMetric
const normalisedMetricArb = fc.record({
  inverterId: fc.uuid(),
  recordedAt: fc.date().map((d) => d.toISOString()),
  batterySoc: fc.float({ min: 0, max: 100, noNaN: true }),
  solarPowerKw: fc.float({ min: 0, max: 50, noNaN: true }),
  acOutputPowerKw: fc.float({ min: 0, max: 50, noNaN: true }),
  gridVoltageV: fc.float({ min: 200, max: 260, noNaN: true }),
  gridFrequencyHz: fc.float({ min: 49, max: 51, noNaN: true }),
  inverterStatus: fc.constantFrom('normal', 'fault', 'bulk', 'absorption'),
  batteryVoltageV: fc.option(fc.float({ min: 40, max: 60, noNaN: true }), {
    nil: null,
  }),
  batteryCurrentA: fc.option(fc.float({ min: -50, max: 50, noNaN: true }), {
    nil: null,
  }),
  batteryTemperatureC: fc.option(fc.float({ min: 0, max: 60, noNaN: true }), {
    nil: null,
  }),
  batteryTimeToGoMin: fc.option(fc.float({ min: 0, max: 1440, noNaN: true }), {
    nil: null,
  }),
  inverterTemperatureC: fc.option(fc.float({ min: 0, max: 80, noNaN: true }), {
    nil: null,
  }),
});

// ---------------------------------------------------------------------------
// Mocks — defined at module level so Jest hoisting works correctly
// ---------------------------------------------------------------------------

const mockFetchMetrics = jest.fn<
  Promise<NormalisedMetric>,
  [string, string, string]
>();
const mockFindAllVictron = jest.fn<Promise<Inverter[]>, []>();
const mockRepoCreate = jest.fn();
const mockRepoSave = jest.fn<Promise<InvertersMetrics>, [InvertersMetrics]>();
const mockPublish = jest.fn<Promise<void>, [string, string]>();

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

describe('MetricsPollerService', () => {
  let service: MetricsPollerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(SecretManager, 'decrypt').mockReturnValue('decrypted-token');

    mockRepoCreate.mockImplementation((dto: Partial<InvertersMetrics>) => dto);
    mockRepoSave.mockResolvedValue({} as InvertersMetrics);
    mockPublish.mockResolvedValue(undefined);

    // Wire mockPublish into the auto-mocked MetricsPubSubService instance
    (
      MetricsPubSubService as jest.MockedClass<typeof MetricsPubSubService>
    ).prototype.publish = mockPublish;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsPollerService,
        {
          provide: VictronAdapter,
          useValue: { fetchMetrics: mockFetchMetrics },
        },
        {
          provide: InverterModelAction,
          useValue: { findAllVictron: mockFindAllVictron },
        },
        {
          provide: getRepositoryToken(InvertersMetrics),
          useValue: { create: mockRepoCreate, save: mockRepoSave },
        },
        {
          provide: MetricsPubSubService,
          useValue: { publish: mockPublish },
        },
      ],
    }).compile();

    service = module.get<MetricsPollerService>(MetricsPollerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // onModuleInit — startup loading
  // ---------------------------------------------------------------------------

  describe('onModuleInit', () => {
    it('loads active Victron inverters at startup', async () => {
      mockFindAllVictron.mockResolvedValue([makeInverter()]);

      await service.onModuleInit();

      expect(mockFindAllVictron).toHaveBeenCalledTimes(1);
    });

    it('starts without error when no inverters are found', async () => {
      mockFindAllVictron.mockResolvedValue([]);

      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // pollVictron — poll cycle
  // ---------------------------------------------------------------------------

  describe('pollVictron', () => {
    it('does nothing when no inverters are registered', async () => {
      mockFindAllVictron.mockResolvedValue([]);
      await service.onModuleInit();

      await service.pollVictron();

      expect(mockFetchMetrics).not.toHaveBeenCalled();
    });

    it('polls all registered inverters', async () => {
      mockFindAllVictron.mockResolvedValue([
        makeInverter({ id: 'inv-1' }),
        makeInverter({ id: 'inv-2' }),
      ]);
      mockFetchMetrics
        .mockResolvedValueOnce(makeMetric('inv-1'))
        .mockResolvedValueOnce(makeMetric('inv-2'));
      await service.onModuleInit();

      await service.pollVictron();

      expect(mockFetchMetrics).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // P1: NormalisedMetric persistence round-trip
  // Feature: real-time-metrics-streaming, Property 1
  // ---------------------------------------------------------------------------

  describe('P1: NormalisedMetric persistence round-trip', () => {
    it('maps all NormalisedMetric fields correctly to InvertersMetrics entity', async () => {
      await fc.assert(
        fc.asyncProperty(normalisedMetricArb, async (metric) => {
          jest.clearAllMocks();
          jest
            .spyOn(SecretManager, 'decrypt')
            .mockReturnValue('decrypted-token');
          mockRepoCreate.mockImplementation(
            (dto: Partial<InvertersMetrics>) => dto,
          );
          mockRepoSave.mockResolvedValue({} as InvertersMetrics);
          mockPublish.mockResolvedValue(undefined);

          mockFindAllVictron.mockResolvedValue([
            makeInverter({ id: metric.inverterId, installationId: 'site-1' }),
          ]);
          mockFetchMetrics.mockResolvedValue(metric);
          await service.onModuleInit();

          await service.pollVictron();

          const calls = mockRepoCreate.mock.calls as [
            Partial<InvertersMetrics>,
          ][];
          const createCall = calls[0]?.[0];
          expect(createCall).toBeDefined();
          expect(createCall?.inverterId).toBe(metric.inverterId);
          expect(createCall?.solarGenKw).toBe(metric.solarPowerKw);
          expect(createCall?.batterySocPercent).toBe(metric.batterySoc);
          expect(createCall?.loadKw).toBe(metric.acOutputPowerKw);
          expect(createCall?.inverterStatus).toBe(metric.inverterStatus);
        }),
        { numRuns: 100 },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // P4: Adapter failure skips DB write and Redis publish
  // Feature: real-time-metrics-streaming, Property 4
  // ---------------------------------------------------------------------------

  describe('P4: Adapter failure skips DB write and Redis publish', () => {
    it('skips save and publish when fetchMetrics throws VrmApiException', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 400, max: 599 }),
          async (statusCode) => {
            jest.clearAllMocks();
            jest
              .spyOn(SecretManager, 'decrypt')
              .mockReturnValue('decrypted-token');
            mockRepoSave.mockResolvedValue({} as InvertersMetrics);
            mockPublish.mockResolvedValue(undefined);

            mockFindAllVictron.mockResolvedValue([makeInverter()]);
            mockFetchMetrics.mockRejectedValue(
              new VrmApiException(statusCode, 'API error'),
            );
            await service.onModuleInit();

            await service.pollVictron();

            expect(mockRepoSave).not.toHaveBeenCalled();
            expect(mockPublish).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('skips publish when DB save throws', async () => {
      mockFindAllVictron.mockResolvedValue([makeInverter()]);
      mockFetchMetrics.mockResolvedValue(makeMetric());
      mockRepoSave.mockRejectedValue(new Error('DB error'));
      await service.onModuleInit();

      await service.pollVictron();

      expect(mockPublish).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // P11: Poll cycle isolation — one failure does not affect others
  // Feature: real-time-metrics-streaming, Property 11
  // ---------------------------------------------------------------------------

  describe('P11: Poll cycle isolation', () => {
    it('continues polling remaining inverters when one adapter throws', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          async (count, failIndexRaw) => {
            jest.clearAllMocks();
            jest
              .spyOn(SecretManager, 'decrypt')
              .mockReturnValue('decrypted-token');
            mockRepoCreate.mockImplementation(
              (dto: Partial<InvertersMetrics>) => dto,
            );
            mockRepoSave.mockResolvedValue({} as InvertersMetrics);
            mockPublish.mockResolvedValue(undefined);

            const failIndex = failIndexRaw % count;
            const inverters = Array.from({ length: count }, (_, i) =>
              makeInverter({ id: `inv-${i}`, installationId: `site-${i}` }),
            );
            mockFindAllVictron.mockResolvedValue(inverters);

            mockFetchMetrics.mockImplementation(
              (_token: string, _siteId: string, inverterId: string) => {
                if (inverterId === `inv-${failIndex}`) {
                  return Promise.reject(new VrmApiException(500, 'fail'));
                }
                return Promise.resolve(makeMetric(inverterId));
              },
            );

            await service.onModuleInit();
            await service.pollVictron();

            const expectedSuccessCount = count - 1;
            expect(mockRepoSave).toHaveBeenCalledTimes(expectedSuccessCount);
            expect(mockPublish).toHaveBeenCalledTimes(expectedSuccessCount);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // P12: Intra-inverter error propagation
  // Feature: real-time-metrics-streaming, Property 12
  // ---------------------------------------------------------------------------

  describe('P12: Intra-inverter error propagation', () => {
    it('skips publish when save fails, but does not affect other inverters', async () => {
      mockFindAllVictron.mockResolvedValue([
        makeInverter({ id: 'inv-good', installationId: 'site-good' }),
        makeInverter({ id: 'inv-bad', installationId: 'site-bad' }),
      ]);

      mockFetchMetrics.mockImplementation(
        (_token: string, _siteId: string, inverterId: string) =>
          Promise.resolve(makeMetric(inverterId)),
      );

      mockRepoCreate.mockImplementation(
        (dto: Partial<InvertersMetrics>) => dto,
      );
      mockRepoSave.mockImplementation((entity: Partial<InvertersMetrics>) => {
        if (entity.inverterId === 'inv-bad') {
          return Promise.reject(new Error('DB error'));
        }
        return Promise.resolve(entity as InvertersMetrics);
      });

      await service.onModuleInit();
      await service.pollVictron();

      expect(mockPublish).toHaveBeenCalledTimes(1);
      expect(mockPublish).toHaveBeenCalledWith(
        'inverter:inv-good',
        expect.any(String),
      );
    });

    it('does not crash when publish fails after a successful save', async () => {
      mockFindAllVictron.mockResolvedValue([makeInverter()]);
      mockFetchMetrics.mockResolvedValue(makeMetric());
      mockRepoCreate.mockImplementation(
        (dto: Partial<InvertersMetrics>) => dto,
      );
      mockRepoSave.mockResolvedValue({} as InvertersMetrics);
      mockPublish.mockRejectedValue(new Error('Redis error'));

      await service.onModuleInit();
      await expect(service.pollVictron()).resolves.not.toThrow();

      expect(mockRepoSave).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Credential decryption failure
  // ---------------------------------------------------------------------------

  describe('credential decryption failure', () => {
    it('skips fetch, save, and publish when decrypt throws', async () => {
      jest.spyOn(SecretManager, 'decrypt').mockImplementation(() => {
        throw new Error('bad key');
      });

      mockFindAllVictron.mockResolvedValue([makeInverter()]);
      await service.onModuleInit();

      await service.pollVictron();

      expect(mockFetchMetrics).not.toHaveBeenCalled();
      expect(mockRepoSave).not.toHaveBeenCalled();
      expect(mockPublish).not.toHaveBeenCalled();
    });
  });
});
