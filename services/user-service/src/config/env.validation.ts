const REQUIRED_ENV = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME'] as const;

type EnvMap = Record<string, string | undefined>;

export function validateEnv(raw: Record<string, unknown>): EnvMap {
  const env = raw as EnvMap;
  const missing: string[] = REQUIRED_ENV.filter((key) => !env[key]);

  if (!env.DB_PASSWORD && !env.DB_PASS) {
    missing.push('DB_PASSWORD|DB_PASS');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const dbPort = Number(env.DB_PORT);
  if (!Number.isInteger(dbPort) || dbPort <= 0) {
    throw new Error('DB_PORT must be a positive integer');
  }

  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  return {
    ...env,
    DB_PORT: String(dbPort),
    PORT: String(port),
    RMQ_URL: env.RMQ_URL ?? 'amqp://guest:guest@localhost:5672',
    RMQ_QUEUE: env.RMQ_QUEUE ?? 'user_events',
    OIDC_ISSUER: env.OIDC_ISSUER ?? 'http://localhost:3001',
    OIDC_AUDIENCE: env.OIDC_AUDIENCE ?? 'toka-api',
    DB_MIGRATIONS_RUN: env.DB_MIGRATIONS_RUN ?? 'true',
  };
}
