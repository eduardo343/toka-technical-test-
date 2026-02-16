import { ConsoleLogger } from '@nestjs/common';

export class JsonLoggerService extends ConsoleLogger {
  constructor(private readonly serviceName: string) {
    super(serviceName);
  }

  log(message: unknown, context?: string): void {
    this.writeJson('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.writeJson('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.writeJson('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.writeJson('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.writeJson('verbose', message, context);
  }

  private writeJson(level: string, message: unknown, context?: string, trace?: string): void {
    process.stdout.write(
      `${JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service: this.serviceName,
        context: context ?? this.serviceName,
        message,
        trace,
      })}\n`,
    );
  }
}
