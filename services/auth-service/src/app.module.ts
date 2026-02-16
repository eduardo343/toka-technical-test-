import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.getOrThrow<string>('DB_HOST'),
        port: Number(cfg.get<string>('DB_PORT', '5433')),
        username: cfg.getOrThrow<string>('DB_USER'),
        password: cfg.get<string>('DB_PASSWORD') ?? cfg.get<string>('DB_PASS'),
        database: cfg.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: cfg.get<string>('DB_MIGRATIONS_RUN', 'true') === 'true',
        migrationsTableName: 'auth_migrations',
        migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
      }),
    }),

    AuthModule,
  ],
})
export class AppModule {}
