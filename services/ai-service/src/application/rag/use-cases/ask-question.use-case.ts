import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AskAiResult, AiSource, TokenUsage } from '../../../domain/qa/ai-answer';
import type { ChatProvider, EmbeddingProvider, VectorStore } from '../../../domain/qa/ports';
import { CHAT_PROVIDER, EMBEDDING_PROVIDER, VECTOR_STORE } from '../../../domain/qa/tokens';
import { EvaluateAnswerUseCase } from './evaluate-answer.use-case';

@Injectable()
export class AskQuestionUseCase {
  constructor(
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    @Inject(VECTOR_STORE)
    private readonly vectorStore: VectorStore,
    @Inject(CHAT_PROVIDER)
    private readonly chatProvider: ChatProvider,
    private readonly evaluateAnswerUseCase: EvaluateAnswerUseCase,
    private readonly configService: ConfigService,
  ) {}

  async execute(question: string, topK?: number): Promise<AskAiResult> {
    const startedAt = Date.now();
    const trimmedQuestion = question.trim();

    const effectiveTopK =
      topK ?? Number(this.configService.get<string>('AI_TOP_K_DEFAULT', '5'));

    const embeddingResult = await this.embeddingProvider.embedTexts([trimmedQuestion]);
    const questionVector = embeddingResult.vectors[0];

    const retrieved = await this.vectorStore.search({
      vector: questionVector,
      topK: effectiveTopK,
    });

    const context = this.buildContext(retrieved);
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(trimmedQuestion, context);

    const chat = await this.chatProvider.answerQuestion({
      systemPrompt,
      userPrompt,
    });

    const latencyMs = Date.now() - startedAt;
    const sources = this.mapSources(retrieved);

    const tokenUsage: TokenUsage = {
      inputTokens: chat.inputTokens,
      outputTokens: chat.outputTokens,
      embeddingTokens: embeddingResult.totalTokens,
    };

    const estimatedCostUsd = this.estimateCostUsd(tokenUsage);

    const qualityChecks = this.evaluateAnswerUseCase.execute({
      question: trimmedQuestion,
      answer: chat.answer,
      sources,
      latencyMs,
    });

    return {
      answer: chat.answer,
      model: chat.model,
      latencyMs,
      estimatedCostUsd,
      tokenUsage,
      sources,
      qualityChecks,
    };
  }

  private buildSystemPrompt(): string {
    return [
      'Eres un asistente técnico de backend.',
      'Responde solamente con información del contexto recuperado.',
      'Si el contexto es insuficiente, responde exactamente: "No hay información suficiente en el contexto".',
      'Cita siempre los fragmentos relevantes por su identificador.',
    ].join(' ');
  }

  private buildUserPrompt(question: string, context: string): string {
    return [
      `Pregunta:\n${question}`,
      '',
      'Contexto recuperado:',
      context || '[Sin contexto recuperado]',
      '',
      'Instrucciones de respuesta:',
      '- Responde en español.',
      '- Sé concreto.',
      '- Incluye referencias de chunks usados.',
    ].join('\n');
  }

  private buildContext(chunks: Array<{ chunkId: string; source: string; text: string; score: number }>): string {
    if (chunks.length === 0) {
      return '';
    }

    return chunks
      .map(
        (chunk, index) =>
          `[${index + 1}] chunk=${chunk.chunkId} source=${chunk.source} score=${chunk.score.toFixed(4)}\n${chunk.text}`,
      )
      .join('\n\n');
  }

  private mapSources(
    chunks: Array<{ documentId: string; chunkId: string; source: string; score: number; text: string }>,
  ): AiSource[] {
    return chunks.map((chunk) => ({
      documentId: chunk.documentId,
      chunkId: chunk.chunkId,
      source: chunk.source,
      score: chunk.score,
      snippet: chunk.text.slice(0, 220),
    }));
  }

  private estimateCostUsd(tokenUsage: TokenUsage): number {
    const inputPrice = Number(this.configService.get<string>('OPENAI_INPUT_PRICE_PER_1K', '0.00015'));
    const outputPrice = Number(
      this.configService.get<string>('OPENAI_OUTPUT_PRICE_PER_1K', '0.00060'),
    );
    const embeddingPrice = Number(
      this.configService.get<string>('OPENAI_EMBEDDING_PRICE_PER_1K', '0.00002'),
    );

    const inputCost = (tokenUsage.inputTokens / 1000) * inputPrice;
    const outputCost = (tokenUsage.outputTokens / 1000) * outputPrice;
    const embeddingCost = (tokenUsage.embeddingTokens / 1000) * embeddingPrice;

    return Number((inputCost + outputCost + embeddingCost).toFixed(8));
  }
}
