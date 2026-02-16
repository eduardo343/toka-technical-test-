import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Credential } from './entities/credential.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import {
  AUDIT_CLIENT,
  AUDIT_EVENTS_QUEUE,
  USER_CLIENT,
  USER_EVENTS_QUEUE,
} from './constants';
import { getAudience, getIssuer, getOidcPrivateKey, getOidcPublicKey } from './oidc/oidc.config';

function resolveJwtExpiresIn(value: string): number | string {
  const asNumber = Number(value);
  if (Number.isInteger(asNumber) && asNumber > 0) {
    return asNumber;
  }

  return value;
}

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Credential]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        privateKey: getOidcPrivateKey(cfg),
        publicKey: getOidcPublicKey(cfg),
        verifyOptions: {
          issuer: getIssuer(cfg),
          audience: getAudience(cfg),
          algorithms: ['RS256'],
        },
        signOptions: {
          algorithm: 'RS256',
          issuer: getIssuer(cfg),
          audience: getAudience(cfg),
          keyid: cfg.get<string>('OIDC_KEY_ID', 'toka-auth-key-1'),
          expiresIn: resolveJwtExpiresIn(cfg.get<string>('JWT_EXPIRES_IN', '1h')) as any,
        },
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: USER_CLIENT,
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [cfg.get<string>('RMQ_URL', 'amqp://guest:guest@localhost:5672')],
            queue: cfg.get<string>('RMQ_QUEUE', USER_EVENTS_QUEUE),
            queueOptions: { durable: true },
          },
        }),
      },
      {
        name: AUDIT_CLIENT,
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [cfg.get<string>('RMQ_URL', 'amqp://guest:guest@localhost:5672')],
            queue: cfg.get<string>('AUDIT_EVENTS_QUEUE', AUDIT_EVENTS_QUEUE),
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
