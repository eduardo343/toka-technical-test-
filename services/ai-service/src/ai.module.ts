import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngestUsersUseCase } from './application/rag/use-cases/ingest-users.use-case';
import { AskQuestionUseCase } from './application/rag/use-cases/ask-question.use-case';
import { EvaluateAnswerUseCase } from './application/rag/use-cases/evaluate-answer.use-case';
import {
  AUTH_TOKEN_PROVIDER,
  CHAT_PROVIDER,
  EMBEDDING_PROVIDER,
  USER_DIRECTORY_PROVIDER,
  VECTOR_STORE,
} from './domain/qa/tokens';
import { OpenAiEmbeddingProvider } from './infrastructure/embeddings/openai-embedding.provider';
import { AuthServiceClient } from './infrastructure/http/auth-service.client';
import { UserServiceClient } from './infrastructure/http/user-service.client';
import { OpenAiChatProvider } from './infrastructure/llm/openai-chat.provider';
import { QdrantVectorStore } from './infrastructure/vector-store/qdrant-vector-store';
import { AiController } from './interfaces/http/ai.controller';
import { InMemoryRateLimiterService } from './shared/rate-limit/in-memory-rate-limiter.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    { provide: EMBEDDING_PROVIDER, useClass: OpenAiEmbeddingProvider },
    { provide: CHAT_PROVIDER, useClass: OpenAiChatProvider },
    { provide: VECTOR_STORE, useClass: QdrantVectorStore },
    { provide: AUTH_TOKEN_PROVIDER, useClass: AuthServiceClient },
    { provide: USER_DIRECTORY_PROVIDER, useClass: UserServiceClient },
    InMemoryRateLimiterService,
    EvaluateAnswerUseCase,
    IngestUsersUseCase,
    AskQuestionUseCase,
  ],
})
export class AiModule {}
