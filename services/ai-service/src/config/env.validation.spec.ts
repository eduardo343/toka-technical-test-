import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('throws when required env is missing', () => {
    expect(() => validateEnv({})).toThrow('Missing required environment variables');
  });

  it('returns defaults when required env exists', () => {
    const env = validateEnv({
      OPENAI_API_KEY: 'key',
      QDRANT_URL: 'http://localhost:6333',
      QDRANT_COLLECTION: 'toka_knowledge',
      AUTH_BASE_URL: 'http://localhost:3001',
      USER_SERVICE_URL: 'http://localhost:3000',
      OAUTH_CLIENT_ID: 'client',
      OAUTH_CLIENT_SECRET: 'secret',
    });

    expect(env.PORT).toBe('3004');
    expect(env.AI_TOP_K_DEFAULT).toBe('5');
    expect(env.OPENAI_CHAT_MODEL).toBe('gpt-4o-mini');
  });
});
