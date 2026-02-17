import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('AiService (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
    process.env.QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
    process.env.QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'test_collection';
    process.env.AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'http://localhost:3001';
    process.env.USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3000';
    process.env.OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || 'toka-internal-client';
    process.env.OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || 'toka-internal-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ai/health (GET)', async () => {
    await request(app.getHttpServer()).get('/ai/health').expect((res) => {
      expect([200, 503]).toContain(res.status);
    });
  });
});
