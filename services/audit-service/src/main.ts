import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { AUDIT_EVENTS_QUEUE } from './infrastructure/messaging/constants';
import { JsonLoggerService } from './shared/logging/json-logger.service';
import { requestLogger } from './shared/logging/request-logger.middleware';

async function bootstrap() {
  const serviceName = 'audit-service';
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new JsonLoggerService(serviceName));
  app.use(requestLogger(serviceName));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RMQ_URL || 'amqp://guest:guest@localhost:5672'],
      queue: process.env.AUDIT_EVENTS_QUEUE || AUDIT_EVENTS_QUEUE,
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();

  const port = Number(process.env.PORT ?? '3003');
  await app.listen(port);
}

bootstrap();
