import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { validateEnv } from './config/env.validation';
import { RoleModule } from './role.module';

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
        migrationsTableName: 'role_migrations',
        migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
      }),
    }),
    RoleModule,
  ],
})
export class AppModule {}
