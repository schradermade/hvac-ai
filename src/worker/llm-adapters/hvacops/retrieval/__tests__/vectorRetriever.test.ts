import { createVectorRetriever } from '../vectorRetriever';
import type { VectorizeIndex } from '../../../../server/copilot/workerTypes';

describe('createVectorRetriever', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('falls back to unfiltered matches when filtered queries return none', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
    }) as typeof fetch;

    const index: VectorizeIndex = {
      query: async (_embedding, options) => {
        if (options?.filter) {
          return { matches: [] };
        }
        return {
          matches: [
            {
              id: 'doc_1',
              score: 0.9,
              metadata: { tenant_id: 't1', job_id: 'j1', doc_id: 'doc_1', text: 'Note' },
            },
          ],
        };
      },
    };

    const retriever = createVectorRetriever({ index, apiKey: 'key' });
    const result = await retriever.retrieve('query', { tenantId: 't1', jobId: 'j1' });

    expect(result.evidence).toHaveLength(1);
    expect(result.debug?.vectorFilterFallbackUsed).toBe(true);
  });
});
