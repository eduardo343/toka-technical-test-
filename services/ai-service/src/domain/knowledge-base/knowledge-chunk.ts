export type KnowledgeChunk = {
  id: string;
  chunkId: string;
  documentId: string;
  source: string;
  text: string;
  tags: string[];
  vector: number[];
  metadata: Record<string, string | number | boolean | null>;
};

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  source: string;
  text: string;
  score: number;
  metadata: Record<string, string | number | boolean | null>;
};
