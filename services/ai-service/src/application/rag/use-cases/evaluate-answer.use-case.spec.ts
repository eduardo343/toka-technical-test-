import { EvaluateAnswerUseCase } from './evaluate-answer.use-case';

describe('EvaluateAnswerUseCase', () => {
  const useCase = new EvaluateAnswerUseCase();

  it('marks answer as grounded when there are sources and valid answer', () => {
    const result = useCase.execute({
      question: '¿Qué endpoint lista usuarios?',
      answer: 'El endpoint es GET /users. Referencia: user-doc#0',
      sources: [
        {
          documentId: 'user-doc',
          chunkId: 'user-doc#0',
          source: 'user-service.users',
          score: 0.91,
          snippet: 'GET /users',
        },
      ],
      latencyMs: 400,
    });

    expect(result.grounded).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('returns low score when answer has no sources', () => {
    const result = useCase.execute({
      question: '¿Qué endpoint lista usuarios?',
      answer: '',
      sources: [],
      latencyMs: 8000,
    });

    expect(result.hasSources).toBe(false);
    expect(result.nonEmptyAnswer).toBe(false);
    expect(result.latencyOk).toBe(false);
    expect(result.score).toBeLessThan(30);
  });
});
