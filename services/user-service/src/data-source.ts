import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable "${name}"`);
  }
  return value;
}

const dbPassword = process.env.DB_PASSWORD ?? process.env.DB_PASS;
if (!dbPassword) {
  throw new Error('Missing required environment variable "DB_PASSWORD" or "DB_PASS"');
}

const dbPort = Number(process.env.DB_PORT ?? '5433');
if (!Number.isInteger(dbPort) || dbPort <= 0) {
  throw new Error('DB_PORT must be a positive integer');
}

export default new DataSource({
  type: 'postgres',
  host: getRequired('DB_HOST'),
  port: dbPort,
  username: getRequired('DB_USER'),
  password: dbPassword,
  database: getRequired('DB_NAME'),
  entities: [User],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});
