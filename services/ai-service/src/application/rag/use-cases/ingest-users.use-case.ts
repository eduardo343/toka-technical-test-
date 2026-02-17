import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { UserDocument } from '../../../domain/document/user-document';
import { KnowledgeChunk } from '../../../domain/knowledge-base/knowledge-chunk';
import type { EmbeddingProvider, UserDirectoryProvider, VectorStore } from '../../../domain/qa/ports';
import { EMBEDDING_PROVIDER, USER_DIRECTORY_PROVIDER, VECTOR_STORE } from '../../../domain/qa/tokens';

export type IngestUsersResult = {
  usersFetched: number;
  chunksIndexed: number;
  embeddingTokens: number;
  latencyMs: number;
};

@Injectable()
export class IngestUsersUseCase {
  constructor(
    @Inject(USER_DIRECTORY_PROVIDER)
    private readonly userDirectoryProvider: UserDirectoryProvider,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    @Inject(VECTOR_STORE)
    private readonly vectorStore: VectorStore,
  ) {}

  async execute(limit?: number): Promise<IngestUsersResult> {
    const startedAt = Date.now();
    const users = await this.userDirectoryProvider.getUsers(limit);

    if (users.length === 0) {
      return {
        usersFetched: 0,
        chunksIndexed: 0,
        embeddingTokens: 0,
        latencyMs: Date.now() - startedAt,
      };
    }

    const plainChunks = users.flatMap((user) => this.toUserChunks(user));
    const texts = plainChunks.map((chunk) => chunk.text);
    const { vectors, totalTokens } = await this.embeddingProvider.embedTexts(texts);

    const chunksWithVectors: KnowledgeChunk[] = plainChunks.map((chunk, index) => ({
      ...chunk,
      vector: vectors[index],
    }));

    await this.vectorStore.upsertChunks(chunksWithVectors);

    return {
      usersFetched: users.length,
      chunksIndexed: chunksWithVectors.length,
      embeddingTokens: totalTokens,
      latencyMs: Date.now() - startedAt,
    };
  }

  private toUserChunks(user: UserDocument): Omit<KnowledgeChunk, 'vector'>[] {
    const content = [
      `User ID: ${user.id}`,
      `Email: ${user.email}`,
      `Name: ${user.name ?? '(sin nombre)'}`,
      `Created At: ${user.createdAt ?? 'unknown'}`,
      `Updated At: ${user.updatedAt ?? 'unknown'}`,
    ].join('\n');

    return this.chunkText(content, 900).map((chunkText, index) => {
      const chunkId = `${user.id}#${index}`;
      return {
        id: this.hashId(`user:${chunkId}:${chunkText}`),
        chunkId,
        documentId: user.id,
        source: 'user-service.users',
        text: chunkText,
        tags: ['users'],
        metadata: {
          userId: user.id,
          email: user.email,
        },
      };
    });
  }

  private chunkText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let cursor = 0;

    while (cursor < text.length) {
      const next = Math.min(cursor + maxLength, text.length);
      chunks.push(text.slice(cursor, next));
      cursor = next;
    }

    return chunks;
  }

  private hashId(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }
}
