export interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface VectorizeQueryResponse {
  matches?: VectorizeMatch[];
}

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
  ) => Promise<VectorizeQueryResponse>;
}

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

export async function fetchOpenAIEmbedding(apiKey: string, input: string, model: string) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
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
  options: { topK: number; filter?: Record<string, unknown> }
): Promise<VectorizeMatch[]> {
  const filter =
    options.filter && Object.keys(options.filter).length > 0 ? options.filter : undefined;
  const response = await index.query(embedding, {
    topK: options.topK,
    filter,
    returnMetadata: true,
  });
  return response.matches ?? [];
}

export async function queryVectorizeWithFilterCandidates(
  index: VectorizeIndex,
  embedding: number[],
  options: {
    topK: number;
    filters: Record<string, unknown>[];
    acceptMatch?: (_match: VectorizeMatch) => boolean;
  }
): Promise<{
  matches: VectorizeMatch[];
  filterUsed: Record<string, unknown> | null;
  filterErrors: Array<{ filter: Record<string, unknown>; message: string }>;
}> {
  const filterErrors: Array<{ filter: Record<string, unknown>; message: string }> = [];
  for (const filter of options.filters) {
    try {
      const matches = await queryVectorize(index, embedding, {
        topK: options.topK,
        filter,
      });
      const acceptedMatches = options.acceptMatch ? matches.filter(options.acceptMatch) : matches;
      if (acceptedMatches.length > 0) {
        return { matches: acceptedMatches, filterUsed: filter, filterErrors };
      }
    } catch (error) {
      filterErrors.push({
        filter,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { matches: [], filterUsed: null, filterErrors };
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
