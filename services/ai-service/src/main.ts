import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JsonLoggerService } from './shared/logging/json-logger.service';
import { requestLogger } from './shared/logging/request-logger.middleware';

async function bootstrap() {
  const serviceName = 'ai-service';
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(new JsonLoggerService(serviceName));
  app.use(requestLogger(serviceName));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? '3004');
  await app.listen(port);
}

bootstrap();
