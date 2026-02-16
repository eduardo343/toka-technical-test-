import { NextFunction, Request, Response } from 'express';

export function requestLogger(service: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      process.stdout.write(
        `${JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          service,
          type: 'http_access',
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        })}\n`,
      );
    });

    next();
  };
}
