import type { RetrievalResult, Retriever, RetrievalScope } from './types';

export function createHybridRetriever(): Retriever {
  return {
    async retrieve(_query: string, _scope: RetrievalScope): Promise<RetrievalResult> {
      return { evidence: [] };
    },
  };
}
