import type { VectorizeIndex } from '../retrieval/vectorizeClient';

export interface LLMAdapterEnv {
  D1_DB: D1Database;
  OPENAI_API_KEY?: string;
  VECTORIZE_INDEX?: VectorizeIndex;
}
