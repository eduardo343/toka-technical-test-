import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbeddingProvider } from '../../domain/qa/ports';

@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  private readonly client: OpenAI;
  private readonly embeddingModel: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
      baseURL: this.configService.get<string>('OPENAI_BASE_URL') || undefined,
    });

    this.embeddingModel = this.configService.get<string>(
      'OPENAI_EMBEDDING_MODEL',
      'text-embedding-3-small',
    );
  }

  async embedTexts(texts: string[]): Promise<{ vectors: number[][]; totalTokens: number }> {
    if (texts.length === 0) {
      return { vectors: [], totalTokens: 0 };
    }

    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: texts,
    });

    return {
      vectors: response.data.map((item) => item.embedding),
      totalTokens: response.usage?.total_tokens ?? 0,
    };
  }
}
