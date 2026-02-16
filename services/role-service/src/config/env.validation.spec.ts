import { validateEnv } from './env.validation';

describe('role env validation', () => {
  const base = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USER: 'postgres',
    DB_NAME: 'toka_roles',
    DB_PASSWORD: 'postgres',
  };

  it('throws when required variables are missing', () => {
    expect(() => validateEnv({ DB_HOST: 'localhost' })).toThrow(
      'Missing required environment variables',
    );
  });

  it('throws when DB_PORT is invalid', () => {
    expect(() => validateEnv({ ...base, DB_PORT: 'zero' })).toThrow(
      'DB_PORT must be a positive integer',
    );
  });

  it('throws when PORT is invalid', () => {
    expect(() => validateEnv({ ...base, PORT: '0' })).toThrow('PORT must be a positive integer');
  });

  it('returns defaults and accepts DB_PASS alias', () => {
    const env = validateEnv({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'postgres',
      DB_NAME: 'toka_roles',
      DB_PASS: 'postgres',
    });

    expect(env).toMatchObject({
      DB_PORT: '5432',
      PORT: '3002',
      RMQ_URL: 'amqp://guest:guest@localhost:5672',
      AUDIT_EVENTS_QUEUE: 'audit_events',
      OIDC_ISSUER: 'http://localhost:3001',
      OIDC_AUDIENCE: 'toka-api',
      DB_MIGRATIONS_RUN: 'true',
    });
  });
});
