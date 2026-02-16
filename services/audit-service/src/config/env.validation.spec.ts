import { validateEnv } from './env.validation';

describe('audit env validation', () => {
  const base = {
    MONGO_URI: 'mongodb://admin:admin123@localhost:27017/toka_audit?authSource=admin',
  };

  it('throws when MONGO_URI is missing', () => {
    expect(() => validateEnv({})).toThrow('Missing required environment variables: MONGO_URI');
  });

  it('throws when PORT is invalid', () => {
    expect(() => validateEnv({ ...base, PORT: 'abc' })).toThrow('PORT must be a positive integer');
  });

  it('returns defaults when optional vars are not provided', () => {
    const env = validateEnv(base);

    expect(env).toMatchObject({
      PORT: '3003',
      RMQ_URL: 'amqp://guest:guest@localhost:5672',
      AUDIT_EVENTS_QUEUE: 'audit_events',
      OIDC_ISSUER: 'http://localhost:3001',
      OIDC_AUDIENCE: 'toka-api',
    });
  });
});
