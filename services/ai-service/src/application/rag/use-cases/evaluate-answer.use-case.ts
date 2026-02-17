import { Injectable } from '@nestjs/common';
import { AiSource, QualityChecks } from '../../../domain/qa/ai-answer';

export type EvaluateAnswerInput = {
  question: string;
  answer: string;
  sources: AiSource[];
  latencyMs: number;
};

@Injectable()
export class EvaluateAnswerUseCase {
  execute(input: EvaluateAnswerInput): QualityChecks {
    const normalizedAnswer = input.answer.trim();
    const hasSources = input.sources.length > 0;
    const nonEmptyAnswer = normalizedAnswer.length > 0;
    const latencyOk = input.latencyMs > 0 && input.latencyMs <= 5000;

    const saysInsufficientContext =
      normalizedAnswer.toLowerCase().includes('no hay información suficiente') ||
      normalizedAnswer.toLowerCase().includes('insufficient context');

    const grounded = hasSources && nonEmptyAnswer && !saysInsufficientContext;

    let score = 0;
    if (hasSources) score += 30;
    if (nonEmptyAnswer) score += 25;
    if (latencyOk) score += 20;
    if (grounded) score += 25;

    return {
      hasSources,
      nonEmptyAnswer,
      latencyOk,
      grounded,
      score,
    };
  }
}
