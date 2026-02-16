import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JsonLoggerService } from './shared/logging/json-logger.service';
import { requestLogger } from './shared/logging/request-logger.middleware';

async function bootstrap() {
  const serviceName = 'auth-service';
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

  const port = Number(process.env.PORT ?? '3001');
  await app.listen(port);
}

bootstrap();
