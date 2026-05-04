import { HealthController } from './health.controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-04T00:00:00.000Z'));
    healthController = new HealthController();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns the health payload', () => {
    jest.spyOn(process, 'uptime').mockReturnValue(123.456);

    expect(healthController.check()).toEqual({
      status: 'ok',
      uptime: 123.456,
      timestamp: '2026-05-04T00:00:00.000Z',
    });
  });
});
