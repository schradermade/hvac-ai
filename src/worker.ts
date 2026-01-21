import { getJobContextSnapshot } from '@/server/copilot/jobContext';
import { getJobEvidence } from '@/server/copilot/jobEvidence';
import { fetchOpenAIEmbedding, queryVectorize, toEvidenceChunks } from '@/server/copilot/vectorize';
import { reindexJobEvidence } from '@/server/copilot/indexing';

/* eslint-disable no-unused-vars */
interface Env {
  D1_DB: D1Database;
  OPENAI_API_KEY: string;
  VECTORIZE_ADMIN_TOKEN?: string;
  VECTORIZE_INDEX?: {
    query: (..._args: [number[], { topK?: number; filter?: Record<string, unknown> }?]) => Promise<{
      matches?: Array<{ id: string; score: number; metadata?: Record<string, unknown> }>;
    }>;
  };
}
/* eslint-enable no-unused-vars */

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  });
}

function parseJobContextPath(pathname: string) {
  const match = pathname.match(/^\/api\/jobs\/([^/]+)\/ai\/context\/?$/);
  if (!match) {
    return null;
  }
  return { jobId: match[1] };
}

function parseJobSessionPath(pathname: string) {
  const match = pathname.match(/^\/api\/jobs\/([^/]+)\/ai\/session\/?$/);
  if (!match) {
    return null;
  }
  return { jobId: match[1] };
}

function parseJobChatPath(pathname: string) {
  const match = pathname.match(/^\/api\/jobs\/([^/]+)\/ai\/chat\/?$/);
  if (!match) {
    return null;
  }
  return { jobId: match[1] };
}

function parseJobReindexPath(pathname: string) {
  const match = pathname.match(/^\/api\/vectorize\/reindex\/job\/([^/]+)\/?$/);
  if (!match) {
    return null;
  }
  return { jobId: match[1] };
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function buildSystemPrompt() {
  return [
    'You are HVACOps Copilot helping a technician on a specific job.',
    'Only answer using the provided structured context.',
    'If you do not see evidence, say you do not see it in the job history.',
    'Be concise and field-oriented.',
    'Citations must reference the provided evidence with doc_id, date, type, snippet.',
    'Return ONLY raw JSON with keys: answer, citations, follow_ups.',
  ].join(' ');
}

function extractJsonPayload(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith('```')) {
    const fenced = trimmed.replace(/^```json\\s*/i, '').replace(/^```\\s*/i, '');
    const withoutFence = fenced.replace(/```\\s*$/, '');
    return withoutFence.trim();
  }
  return trimmed;
}

async function callOpenAI(apiKey: string, payload: unknown) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<{
    choices: Array<{ message?: { content?: string } }>;
  }>;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const contextRoute = parseJobContextPath(url.pathname);
    const sessionRoute = parseJobSessionPath(url.pathname);
    const chatRoute = parseJobChatPath(url.pathname);
    const reindexRoute = parseJobReindexPath(url.pathname);

    if (!contextRoute && !sessionRoute && !chatRoute && !reindexRoute) {
      return jsonResponse({ error: 'Not found' }, { status: 404 });
    }

    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return jsonResponse({ error: 'Missing x-tenant-id header' }, { status: 400 });
    }

    if (contextRoute) {
      if (request.method !== 'GET') {
        return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
      }

      try {
        const snapshot = await getJobContextSnapshot(env.D1_DB, tenantId, contextRoute.jobId);
        return jsonResponse(snapshot, { status: 200 });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return jsonResponse({ error: message }, { status: 500 });
      }
    }

    if (sessionRoute) {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
      }

      return jsonResponse(
        {
          sessionId: `session_${sessionRoute.jobId}`,
          jobId: sessionRoute.jobId,
          tenantId,
          status: 'active',
        },
        { status: 200 }
      );
    }

    if (reindexRoute) {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
      }

      if (!env.VECTORIZE_INDEX) {
        return jsonResponse({ error: 'Vectorize index not configured' }, { status: 500 });
      }

      if (!env.OPENAI_API_KEY) {
        return jsonResponse({ error: 'Missing OpenAI API key' }, { status: 500 });
      }

      const apiKeyHeader = request.headers.get('x-api-key');
      if (!env.VECTORIZE_ADMIN_TOKEN || apiKeyHeader !== env.VECTORIZE_ADMIN_TOKEN) {
        return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
      }

      const result = await reindexJobEvidence({
        db: env.D1_DB,
        vectorize: env.VECTORIZE_INDEX,
        openAiApiKey: env.OPENAI_API_KEY,
        tenantId,
        jobId: reindexRoute.jobId,
      });

      return jsonResponse({ status: 'ok', ...result }, { status: 200 });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    const body = await readJson(request);
    const message = body?.message;
    if (typeof message !== 'string' || message.trim().length === 0) {
      return jsonResponse({ error: 'Missing message' }, { status: 400 });
    }

    const jobId = chatRoute?.jobId ?? '';
    const snapshot = await getJobContextSnapshot(env.D1_DB, tenantId, jobId);
    const evidence = await getJobEvidence(env.D1_DB, tenantId, jobId, 6);
    let vectorEvidence: ReturnType<typeof toEvidenceChunks> = [];
    let vectorMatchCount = 0;
    const vectorizeEnabled = Boolean(env.VECTORIZE_INDEX);
    let embeddingVector: number[] | null = null;
    let unfilteredMatches: Array<{
      id: string;
      score: number;
      metadata?: Record<string, unknown>;
    }> = [];
    let vectorMetadata: Array<{ id: string; metadata?: Record<string, unknown> }> = [];
    let vectorFilterFallbackUsed = false;

    if (env.VECTORIZE_INDEX) {
      const embeddingResponse = await fetchOpenAIEmbedding(env.OPENAI_API_KEY, message);
      const embedding = embeddingResponse.data[0]?.embedding;
      embeddingVector = embedding ?? null;

      if (embedding) {
        const matches = await queryVectorize(env.VECTORIZE_INDEX, embedding, {
          topK: 6,
          filter: {
            tenant_id: tenantId,
            job_id: jobId,
          },
        });
        vectorEvidence = toEvidenceChunks(matches);
        vectorMatchCount = matches.length;

        if (vectorMatchCount === 0) {
          const fallbackMatches = await queryVectorize(env.VECTORIZE_INDEX, embedding, {
            topK: 10,
            filter: {},
          });
          const filteredFallback = fallbackMatches.filter(
            (match) => match.metadata?.tenant_id === tenantId && match.metadata?.job_id === jobId
          );
          if (filteredFallback.length > 0) {
            vectorFilterFallbackUsed = true;
            vectorEvidence = toEvidenceChunks(filteredFallback);
            vectorMatchCount = filteredFallback.length;
          }
        }
      }
    }

    const debugEnabled = request.headers.get('x-debug') === '1';

    if (debugEnabled && env.VECTORIZE_INDEX && embeddingVector) {
      const matches = await queryVectorize(env.VECTORIZE_INDEX, embeddingVector, {
        topK: 3,
        filter: {},
      });
      unfilteredMatches = matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
      }));

      const indexWithGet = env.VECTORIZE_INDEX as unknown as {
        // eslint-disable-next-line no-unused-vars
        get?: (ids: string[]) => Promise<{
          vectors?: Array<{ id: string; metadata?: Record<string, unknown> }>;
        }>;
      };

      if (indexWithGet.get) {
        try {
          const result = await indexWithGet.get(unfilteredMatches.map((match) => match.id));
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

    const aiResponse = await callOpenAI(env.OPENAI_API_KEY, openAiPayload);
    const content = aiResponse.choices[0]?.message?.content ?? '';
    const payloadText = extractJsonPayload(content);
    let parsedResponse: { answer?: string; citations?: unknown[]; follow_ups?: unknown[] } | null =
      null;

    try {
      parsedResponse = JSON.parse(payloadText);
    } catch {
      parsedResponse = null;
    }

    return jsonResponse(
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
              unfilteredMatches,
              vectorMetadata,
              vectorFilterFallbackUsed,
            }
          : undefined,
      },
      { status: 200 }
    );
  },
};
