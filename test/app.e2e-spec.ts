import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HealthModule } from '../src/modules/health/health.module';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  it('GET /health → 200', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          success: boolean;
          message: string;
          data: { status: string };
          meta: { timestamp: string };
        };

        expect(body.success).toBe(true);
        expect(body.message).toBe('Resource retrieved successfully');
        expect(body.data.status).toBe('ok');
        expect(body.meta.timestamp).toBeDefined();
      });
  });

  it('GET /api/v1/health → 404 (v1 health not versioned)', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
