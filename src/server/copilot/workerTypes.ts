export interface VectorizeIndex {
  query: (
    ..._args: [
      number[],
      {
        topK?: number;
        filter?: Record<string, unknown>;
        returnMetadata?: boolean;
      }?,
    ]
  ) => Promise<{
    matches?: Array<{ id: string; score: number; metadata?: Record<string, unknown> }>;
  }>;
  get?: (_ids: string[]) => Promise<{
    vectors?: Array<{ id: string; metadata?: Record<string, unknown> }>;
  }>;
}

export interface Env {
  D1_DB: D1Database;
  OPENAI_API_KEY: string;
  VECTORIZE_ADMIN_TOKEN?: string;
  VECTORIZE_INDEX?: VectorizeIndex;
}

export type AppEnv = {
  Bindings: Env;
  Variables: {
    tenantId: string;
  };
};
