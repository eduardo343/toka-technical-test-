import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AskQuestionUseCase } from '../../application/rag/use-cases/ask-question.use-case';
import { EvaluateAnswerUseCase } from '../../application/rag/use-cases/evaluate-answer.use-case';
import { IngestUsersUseCase } from '../../application/rag/use-cases/ingest-users.use-case';
import type { VectorStore } from '../../domain/qa/ports';
import { VECTOR_STORE } from '../../domain/qa/tokens';
import { InMemoryRateLimiterService } from '../../shared/rate-limit/in-memory-rate-limiter.service';
import { AskAiDto } from './dto/ask-ai.dto';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { IngestUsersDto } from './dto/ingest-users.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly configService: ConfigService,
    private readonly ingestUsersUseCase: IngestUsersUseCase,
    private readonly askQuestionUseCase: AskQuestionUseCase,
    private readonly evaluateAnswerUseCase: EvaluateAnswerUseCase,
    private readonly rateLimiter: InMemoryRateLimiterService,
    @Inject(VECTOR_STORE)
    private readonly vectorStore: VectorStore,
  ) {}

  @Get('health')
  async health() {
    const vectorStoreHealth = await this.vectorStore.health();

    if (vectorStoreHealth.status !== 'up') {
      throw new ServiceUnavailableException({
        status: 'degraded',
        vectorStore: vectorStoreHealth,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      service: 'ai-service',
      vectorStore: vectorStoreHealth,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('ingest/users')
  async ingestUsers(@Body() dto: IngestUsersDto) {
    return this.ingestUsersUseCase.execute(dto.limit);
  }

  @Post('ask')
  async ask(@Body() dto: AskAiDto, @Req() req: Request) {
    const rateLimit = Number(this.configService.get<string>('AI_RATE_LIMIT_RPM', '60'));
    const rate = this.rateLimiter.consume(req.ip ?? 'unknown', rateLimit, 60_000);

    if (!rate.allowed) {
      throw new HttpException(
        `Rate limit exceeded. Retry in ${rate.retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const result = await this.askQuestionUseCase.execute(dto.question, dto.topK);

    return {
      ...result,
      rateLimit: {
        limit: rateLimit,
        remaining: rate.remaining,
        retryAfterSeconds: rate.retryAfterSeconds,
      },
    };
  }

  @Post('evaluate')
  evaluate(@Body() dto: EvaluateAnswerDto) {
    return this.evaluateAnswerUseCase.execute({
      question: dto.question,
      answer: dto.answer,
      sources: dto.sources ?? [],
      latencyMs: dto.latencyMs,
    });
  }
}
