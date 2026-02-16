import { validateEnv } from './env.validation';

describe('auth env validation', () => {
  const base = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USER: 'postgres',
    DB_NAME: 'toka_db',
    DB_PASSWORD: 'postgres',
  };

  it('throws when required variables are missing', () => {
    expect(() => validateEnv({ DB_HOST: 'localhost' })).toThrow(
      'Missing required environment variables',
    );
  });

  it('throws when DB_PORT is invalid', () => {
    expect(() => validateEnv({ ...base, DB_PORT: 'abc' })).toThrow(
      'DB_PORT must be a positive integer',
    );
  });

  it('throws when PORT is invalid', () => {
    expect(() => validateEnv({ ...base, PORT: '0' })).toThrow('PORT must be a positive integer');
  });

  it('accepts DB_PASS alias and fills defaults', () => {
    const env = validateEnv({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'postgres',
      DB_NAME: 'toka_db',
      DB_PASS: 'postgres',
    });

    expect(env).toMatchObject({
      DB_PORT: '5432',
      PORT: '3001',
      JWT_EXPIRES_IN: '1h',
      RMQ_URL: 'amqp://guest:guest@localhost:5672',
      OIDC_ISSUER: 'http://localhost:3001',
      OIDC_AUDIENCE: 'toka-api',
      OAUTH_CLIENT_ID: 'toka-internal-client',
      OAUTH_CLIENT_SECRET: 'toka-internal-secret',
      OIDC_KEY_ID: 'toka-auth-key-1',
      DB_MIGRATIONS_RUN: 'true',
    });
  });
});
