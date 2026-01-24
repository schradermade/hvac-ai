import { Hono } from 'hono';
import { getJobContextSnapshot } from '../jobContext';
import { getJobEvidence } from '../jobEvidence';
import {
  fetchOpenAIEmbedding,
  queryVectorize,
  queryVectorizeWithFilterCandidates,
  toEvidenceChunks,
} from '../vectorize';
import { buildSystemPrompt, callOpenAI, extractJsonPayload } from '../services/ai';
import type { AppEnv } from '../workerTypes';

export function registerChatRoutes(app: Hono<AppEnv>) {
  app.post('/jobs/:jobId/ai/chat', async (c) => {
    const tenantId = c.get('tenantId');

    if (!c.env.OPENAI_API_KEY) {
      return c.json({ error: 'Missing OpenAI API key' }, 500);
    }

    const body = await c.req.json().catch(() => null);
    const message = body?.message;
    if (typeof message !== 'string' || message.trim().length === 0) {
      return c.json({ error: 'Missing message' }, 400);
    }

    const jobId = c.req.param('jobId');
    const snapshot = await getJobContextSnapshot(c.env.D1_DB, tenantId, jobId);
    const evidence = await getJobEvidence(c.env.D1_DB, tenantId, jobId, 6);
    let vectorEvidence: ReturnType<typeof toEvidenceChunks> = [];
    let vectorMatchCount = 0;
    const vectorizeEnabled = Boolean(c.env.VECTORIZE_INDEX);
    let embeddingVector: number[] | null = null;
    let unfilteredMatches: Array<{
      id: string;
      score: number;
      metadata?: Record<string, unknown>;
    }> = [];
    let vectorMetadata: Array<{ id: string; metadata?: Record<string, unknown> }> = [];
    let vectorFilterFallbackUsed = false;
    let vectorFilterUsed: Record<string, unknown> | null = null;
    let vectorFilterErrors: Array<{ filter: Record<string, unknown>; message: string }> = [];

    if (c.env.VECTORIZE_INDEX) {
      const embeddingResponse = await fetchOpenAIEmbedding(c.env.OPENAI_API_KEY, message);
      const embedding = embeddingResponse.data[0]?.embedding;
      embeddingVector = embedding ?? null;

      if (embedding) {
        const filterCandidates = [
          { tenant_id: tenantId, job_id: jobId },
          { tenant_id: String(tenantId), job_id: String(jobId) },
          { tenant_id: tenantId },
          { tenant_id: String(tenantId) },
          { job_id: jobId },
          { job_id: String(jobId) },
        ];
        const filteredResult = await queryVectorizeWithFilterCandidates(
          c.env.VECTORIZE_INDEX,
          embedding,
          {
            topK: 6,
            filters: filterCandidates,
            acceptMatch: (match) =>
              match.metadata?.tenant_id === tenantId && match.metadata?.job_id === jobId,
          }
        );
        vectorFilterUsed = filteredResult.filterUsed;
        vectorFilterErrors = filteredResult.filterErrors;
        vectorEvidence = toEvidenceChunks(filteredResult.matches);
        vectorMatchCount = filteredResult.matches.length;

        if (vectorMatchCount === 0) {
          const fallbackMatches = await queryVectorize(c.env.VECTORIZE_INDEX, embedding, {
            topK: 10,
          });
          const filteredFallback = fallbackMatches.filter(
            (match) => match.metadata?.tenant_id === tenantId && match.metadata?.job_id === jobId
          );
          if (filteredFallback.length > 0) {
            vectorFilterFallbackUsed = true;
            vectorEvidence = toEvidenceChunks(filteredFallback);
            vectorMatchCount = filteredFallback.length;
            console.warn(
              `Vectorize filter returned 0 matches; using fallback filter for tenant ${tenantId} job ${jobId}`
            );
          }
        }
      }
    }
    const debugEnabled = c.req.header('x-debug') === '1';

    if (debugEnabled && c.env.VECTORIZE_INDEX && embeddingVector) {
      const matches = await queryVectorize(c.env.VECTORIZE_INDEX, embeddingVector, {
        topK: 3,
      });
      unfilteredMatches = matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
      }));

      if (c.env.VECTORIZE_INDEX.get) {
        try {
          const result = await c.env.VECTORIZE_INDEX.get(
            unfilteredMatches.map((match) => match.id)
          );
          vectorMetadata = result.vectors ?? [];
        } catch {
          vectorMetadata = [];
        }
      }
    }

    const openAiPayload = {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        {
          role: 'user',
          content: `Structured context:\\n${JSON.stringify(snapshot)}\\n\\nEvidence:\\n${JSON.stringify(
            [...evidence, ...vectorEvidence]
          )}\\n\\nUser question:\\n${message}`,
        },
      ],
    };

    const aiResponse = await callOpenAI(c.env.OPENAI_API_KEY, openAiPayload);
    const content = aiResponse.choices[0]?.message?.content ?? '';
    const payloadText = extractJsonPayload(content);
    let parsedResponse: { answer?: string; citations?: unknown[]; follow_ups?: unknown[] } | null =
      null;

    try {
      parsedResponse = JSON.parse(payloadText);
    } catch {
      parsedResponse = null;
    }

    return c.json(
      {
        answer: parsedResponse?.answer ?? content,
        citations: parsedResponse?.citations ?? [],
        follow_ups: parsedResponse?.follow_ups ?? [],
        debug: debugEnabled
          ? {
              vectorizeEnabled,
              vectorMatches: vectorMatchCount,
              evidenceCount: evidence.length,
              vectorFilter: { tenant_id: tenantId, job_id: jobId },
              vectorFilterUsed,
              vectorFilterErrors,
              unfilteredMatches,
              vectorMetadata,
              vectorFilterFallbackUsed,
            }
          : undefined,
      },
      200
    );
  });
}
