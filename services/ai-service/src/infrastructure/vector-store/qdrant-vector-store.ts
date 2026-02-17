import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { KnowledgeChunk, RetrievedChunk } from '../../domain/knowledge-base/knowledge-chunk';
import { VectorStore } from '../../domain/qa/ports';

@Injectable()
export class QdrantVectorStore implements VectorStore {
  private readonly client: QdrantClient;
  private readonly collectionName: string;
  private readonly vectorSize: number;
  private collectionReady = false;

  constructor(private readonly configService: ConfigService) {
    this.client = new QdrantClient({
      url: this.configService.getOrThrow<string>('QDRANT_URL'),
    });

    this.collectionName = this.configService.getOrThrow<string>('QDRANT_COLLECTION');
    this.vectorSize = Number(this.configService.get<string>('QDRANT_VECTOR_SIZE', '1536'));
  }

  async upsertChunks(chunks: KnowledgeChunk[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    await this.ensureCollection();

    await this.client.upsert(this.collectionName, {
      wait: true,
      points: chunks.map((chunk) => ({
        id: chunk.id,
        vector: chunk.vector,
        payload: {
          chunkId: chunk.chunkId,
          documentId: chunk.documentId,
          source: chunk.source,
          text: chunk.text,
          tags: chunk.tags,
          ...chunk.metadata,
        },
      })),
    });
  }

  async search(input: { vector: number[]; topK: number }): Promise<RetrievedChunk[]> {
    await this.ensureCollection();

    const points = await this.client.search(this.collectionName, {
      vector: input.vector,
      limit: input.topK,
      with_payload: true,
    });

    return points.map((point) => {
      const payload = (point.payload ?? {}) as Record<string, unknown>;

      const metadata: Record<string, string | number | boolean | null> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (key === 'text' || key === 'chunkId' || key === 'documentId' || key === 'source') {
          continue;
        }

        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          value === null
        ) {
          metadata[key] = value;
        }
      }

      return {
        chunkId: String(payload.chunkId ?? point.id),
        documentId: String(payload.documentId ?? ''),
        source: String(payload.source ?? 'unknown'),
        text: String(payload.text ?? ''),
        score: point.score,
        metadata,
      };
    });
  }

  async health(): Promise<{ status: 'up' | 'down'; detail?: string }> {
    try {
      await this.client.getCollections();
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async ensureCollection(): Promise<void> {
    if (this.collectionReady) {
      return;
    }

    try {
      await this.client.getCollection(this.collectionName);
      this.collectionReady = true;
      return;
    } catch (error) {
      if (!this.isNotFound(error)) {
        throw error;
      }
    }

    await this.client.createCollection(this.collectionName, {
      vectors: {
        size: this.vectorSize,
        distance: 'Cosine',
      },
    });

    this.collectionReady = true;
  }

  private isNotFound(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeStatus =
      'status' in error
        ? (error as { status?: number }).status
        : 'response' in error
          ? ((error as { response?: { status?: number } }).response?.status ?? undefined)
          : undefined;

    return maybeStatus === 404;
  }
}
