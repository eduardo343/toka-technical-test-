import { Injectable } from '@nestjs/common';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class InMemoryRateLimiterService {
  private readonly buckets = new Map<string, Bucket>();

  consume(
    key: string,
    limit: number,
    windowMs: number,
  ): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || now >= current.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        remaining: Math.max(limit - 1, 0),
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      };
    }

    if (current.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
      };
    }

    current.count += 1;
    this.buckets.set(key, current);
    return {
      allowed: true,
      remaining: Math.max(limit - current.count, 0),
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    };
  }
}
