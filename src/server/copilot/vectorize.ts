export interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface VectorizeQueryResponse {
  matches?: VectorizeMatch[];
}

/* eslint-disable no-unused-vars */
export interface VectorizeIndex {
  query: (
    ..._args: [number[], { topK?: number; filter?: Record<string, unknown> }?]
  ) => Promise<VectorizeQueryResponse>;
}
/* eslint-enable no-unused-vars */

export interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

export interface EvidenceChunk {
  docId: string;
  type: string;
  date?: string | null;
  text: string;
  score: number;
}

export async function fetchOpenAIEmbedding(apiKey: string, input: string) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error: ${response.status} ${errorText}`);
  }

  return (await response.json()) as OpenAIEmbeddingResponse;
}

export async function queryVectorize(
  index: VectorizeIndex,
  embedding: number[],
  options: { topK: number; filter: Record<string, unknown> }
): Promise<VectorizeMatch[]> {
  const response = await index.query(embedding, { topK: options.topK, filter: options.filter });
  return response.matches ?? [];
}

export function toEvidenceChunks(matches: VectorizeMatch[]): EvidenceChunk[] {
  return matches.map((match) => {
    const metadata = match.metadata ?? {};
    return {
      docId: String(metadata.doc_id ?? match.id),
      type: String(metadata.type ?? 'vector'),
      date: (metadata.created_at as string | undefined) ?? null,
      text: String(metadata.text ?? ''),
      score: match.score,
    };
  });
}
