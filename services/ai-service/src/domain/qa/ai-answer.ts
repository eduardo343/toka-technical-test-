export type AiSource = {
  documentId: string;
  chunkId: string;
  source: string;
  score: number;
  snippet: string;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  embeddingTokens: number;
};

export type QualityChecks = {
  hasSources: boolean;
  nonEmptyAnswer: boolean;
  latencyOk: boolean;
  grounded: boolean;
  score: number;
};

export type AskAiResult = {
  answer: string;
  model: string;
  latencyMs: number;
  estimatedCostUsd: number;
  tokenUsage: TokenUsage;
  sources: AiSource[];
  qualityChecks: QualityChecks;
};
