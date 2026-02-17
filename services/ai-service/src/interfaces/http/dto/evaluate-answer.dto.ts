import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class EvaluateAnswerDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsNumber()
  @Min(0)
  latencyMs: number;

  @IsOptional()
  @IsArray()
  sources?: Array<{
    documentId: string;
    chunkId: string;
    source: string;
    score: number;
    snippet: string;
  }>;
}
