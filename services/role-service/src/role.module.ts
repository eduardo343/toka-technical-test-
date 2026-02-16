import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ROLE_EVENTS_PUBLISHER, ROLE_REPOSITORY } from './domain/role/tokens';
import { CreateRoleUseCase } from './application/roles/use-cases/create-role.use-case';
import { DeleteRoleUseCase } from './application/roles/use-cases/delete-role.use-case';
import { GetRoleByIdUseCase } from './application/roles/use-cases/get-role-by-id.use-case';
import { ListRolesUseCase } from './application/roles/use-cases/list-roles.use-case';
import { UpdateRoleUseCase } from './application/roles/use-cases/update-role.use-case';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { AUDIT_CLIENT, AUDIT_EVENTS_QUEUE } from './infrastructure/messaging/constants';
import { RmqRoleEventsPublisher } from './infrastructure/messaging/rmq-role-events.publisher';
import { RoleOrmEntity } from './infrastructure/persistence/typeorm/role.orm-entity';
import { RoleTypeOrmRepository } from './infrastructure/persistence/typeorm/role-typeorm.repository';
import { RolesController } from './interfaces/http/roles.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([RoleOrmEntity]),
    ClientsModule.registerAsync([
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
  controllers: [RolesController],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: RoleTypeOrmRepository },
    { provide: ROLE_EVENTS_PUBLISHER, useClass: RmqRoleEventsPublisher },
    CreateRoleUseCase,
    ListRolesUseCase,
    GetRoleByIdUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    JwtStrategy,
  ],
})
export class RoleModule {}
