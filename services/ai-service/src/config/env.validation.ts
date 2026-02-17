const REQUIRED_ENV = [
  'OPENAI_API_KEY',
  'QDRANT_URL',
  'QDRANT_COLLECTION',
  'AUTH_BASE_URL',
  'USER_SERVICE_URL',
  'OAUTH_CLIENT_ID',
  'OAUTH_CLIENT_SECRET',
] as const;

type EnvMap = Record<string, string | undefined>;

function parsePositiveInt(rawValue: string | undefined, key: string, fallback: number): string {
  const numeric = Number(rawValue ?? String(fallback));
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return String(numeric);
}

function parsePositiveNumber(rawValue: string | undefined, key: string, fallback: number): string {
  const numeric = Number(rawValue ?? String(fallback));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`${key} must be a positive number`);
  }
  return String(numeric);
}

export function validateEnv(raw: Record<string, unknown>): EnvMap {
  const env = raw as EnvMap;
  const missing = REQUIRED_ENV.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    ...env,
    PORT: parsePositiveInt(env.PORT, 'PORT', 3004),
    QDRANT_VECTOR_SIZE: parsePositiveInt(env.QDRANT_VECTOR_SIZE, 'QDRANT_VECTOR_SIZE', 1536),
    AI_TOP_K_DEFAULT: parsePositiveInt(env.AI_TOP_K_DEFAULT, 'AI_TOP_K_DEFAULT', 5),
    AI_RATE_LIMIT_RPM: parsePositiveInt(env.AI_RATE_LIMIT_RPM, 'AI_RATE_LIMIT_RPM', 60),
    OPENAI_CHAT_MODEL: env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
    OPENAI_EMBEDDING_MODEL: env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    OPENAI_INPUT_PRICE_PER_1K: parsePositiveNumber(
      env.OPENAI_INPUT_PRICE_PER_1K,
      'OPENAI_INPUT_PRICE_PER_1K',
      0.00015,
    ),
    OPENAI_OUTPUT_PRICE_PER_1K: parsePositiveNumber(
      env.OPENAI_OUTPUT_PRICE_PER_1K,
      'OPENAI_OUTPUT_PRICE_PER_1K',
      0.0006,
    ),
    OPENAI_EMBEDDING_PRICE_PER_1K: parsePositiveNumber(
      env.OPENAI_EMBEDDING_PRICE_PER_1K,
      'OPENAI_EMBEDDING_PRICE_PER_1K',
      0.00002,
    ),
    OAUTH_SCOPE: env.OAUTH_SCOPE ?? 'openid profile email audit:read roles:write',
  };
}
