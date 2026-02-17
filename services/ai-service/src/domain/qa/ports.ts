import { UserDocument } from '../document/user-document';
import { KnowledgeChunk, RetrievedChunk } from '../knowledge-base/knowledge-chunk';

export interface EmbeddingProvider {
  embedTexts(texts: string[]): Promise<{ vectors: number[][]; totalTokens: number }>;
}

export interface ChatProvider {
  answerQuestion(input: {
    systemPrompt: string;
    userPrompt: string;
  }): Promise<{ answer: string; inputTokens: number; outputTokens: number; model: string }>;
}

export interface VectorStore {
  upsertChunks(chunks: KnowledgeChunk[]): Promise<void>;
  search(input: { vector: number[]; topK: number }): Promise<RetrievedChunk[]>;
  health(): Promise<{ status: 'up' | 'down'; detail?: string }>;
}

export interface AuthTokenProvider {
  getAccessToken(scope?: string): Promise<string>;
}

export interface UserDirectoryProvider {
  getUsers(limit?: number): Promise<UserDocument[]>;
}
