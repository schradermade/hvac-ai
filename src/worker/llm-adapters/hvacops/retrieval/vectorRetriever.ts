import type { RetrievalResult, Retriever, RetrievalScope } from '../../../llm-core/retrieval/types';
import {
  fetchOpenAIEmbedding,
  queryVectorize,
  queryVectorizeWithFilterCandidates,
  toEvidenceChunks,
} from './vectorizeClient';
import type { VectorizeIndex } from './vectorizeClient';
import { defaultCopilotConfig } from '../../../llm-core/config/defaults';

type VectorDebug = {
  vectorizeEnabled: boolean;
  vectorMatches: number;
  vectorFilterUsed: Record<string, unknown> | null;
  vectorFilterErrors: Array<{ filter: Record<string, unknown>; message: string }>;
  vectorFilterFallbackUsed: boolean;
};

export function createVectorRetriever(params: {
  index?: VectorizeIndex;
  apiKey?: string;
}): Retriever {
  return {
    async retrieve(query: string, scope: RetrievalScope): Promise<RetrievalResult> {
      if (!params.index || !params.apiKey) {
        return {
          evidence: [],
          debug: {
            vectorizeEnabled: false,
            vectorMatches: 0,
            vectorFilterUsed: null,
            vectorFilterErrors: [],
            vectorFilterFallbackUsed: false,
          } satisfies VectorDebug,
        };
      }

      const embeddingResponse = await fetchOpenAIEmbedding(
        params.apiKey,
        query,
        defaultCopilotConfig.model.embeddingModel
      );
      const embedding = embeddingResponse.data[0]?.embedding ?? null;

      if (!embedding) {
        return {
          evidence: [],
          debug: {
            vectorizeEnabled: true,
            vectorMatches: 0,
            vectorFilterUsed: null,
            vectorFilterErrors: [],
            vectorFilterFallbackUsed: false,
          } satisfies VectorDebug,
        };
      }

      const filterCandidates = [
        { tenant_id: scope.tenantId, job_id: scope.jobId },
        { tenant_id: String(scope.tenantId), job_id: String(scope.jobId) },
        { tenant_id: scope.tenantId },
        { tenant_id: String(scope.tenantId) },
        { job_id: scope.jobId },
        { job_id: String(scope.jobId) },
      ];

      const filteredResult = await queryVectorizeWithFilterCandidates(params.index, embedding, {
        topK: defaultCopilotConfig.retrieval.topK,
        filters: filterCandidates,
        acceptMatch: (match) =>
          match.metadata?.tenant_id === scope.tenantId && match.metadata?.job_id === scope.jobId,
      });

      let evidence = toEvidenceChunks(filteredResult.matches);
      let vectorFilterFallbackUsed = false;

      if (evidence.length === 0) {
        const fallbackMatches = await queryVectorize(params.index, embedding, {
          topK: defaultCopilotConfig.retrieval.fallbackTopK,
        });
        const filteredFallback = fallbackMatches.filter(
          (match) =>
            match.metadata?.tenant_id === scope.tenantId && match.metadata?.job_id === scope.jobId
        );
        if (filteredFallback.length > 0) {
          vectorFilterFallbackUsed = true;
          evidence = toEvidenceChunks(filteredFallback);
        }
      }

      return {
        evidence,
        debug: {
          vectorizeEnabled: true,
          vectorMatches: evidence.length,
          vectorFilterUsed: filteredResult.filterUsed,
          vectorFilterErrors: filteredResult.filterErrors,
          vectorFilterFallbackUsed,
        } satisfies VectorDebug,
      };
    },
  };
}
