import { Hono } from 'hono';
import { getJobContextSnapshot, JobNotFoundError } from '../context/buildContext';
import { getJobEvidence } from '../context/buildEvidence';
import {
  fetchOpenAIEmbedding,
  queryVectorize,
  queryVectorizeWithFilterCandidates,
  toEvidenceChunks,
} from '../retrieval/vectorizeClient';
import { defaultCopilotConfig } from '../../../llm-core/config/defaults';
import { parseResponse } from '../../../llm-core/parsing/responseParser';
import { runCopilotOrchestrator } from '../../../llm-core/orchestration/orchestrator';
import { buildPrompt } from '../../../llm-core/prompts/buildPrompt';
import { createOpenAIProvider } from '../models/openaiProvider';
import {
  ensureConversation,
  findConversation,
  findConversationById,
  touchConversation,
} from '../persistence/conversationStore';
import { saveMessage } from '../persistence/messageStore';
import type { ConversationRecord } from '../persistence/conversationStore';
import type { AppEnv } from '../../../server/copilot/workerTypes';

type MessageRow = {
  role: string;
  content: string;
  created_at: string;
  metadata_json?: string | null;
};

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatTimestamp(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace('T', ' ').replace('Z', ' UTC').slice(0, 20);
}

function formatEvidenceSection(
  title: string,
  items: Array<{ text: string; date?: string | null }>
) {
  if (items.length === 0) return '';
  const lines = items.map((item) => {
    const stamp = formatTimestamp(item.date);
    const prefix = stamp ? `[${stamp}] ` : '';
    return `- ${prefix}${item.text}`;
  });
  return `${title}:\n${lines.join('\n')}`;
}

function formatEvidenceForPrompt(
  evidence: Array<{ scope: string; type: string; text: string; date?: string | null }>,
  vectorEvidence: Array<{ text: string; date?: string | null }>
) {
  const jobNotes = evidence.filter((item) => item.scope === 'job' && item.type === 'note');
  const jobEvents = evidence.filter((item) => item.scope === 'job' && item.type === 'job_event');
  const propertyNotes = evidence.filter(
    (item) => item.scope === 'property' && item.type === 'note'
  );
  const propertyEvents = evidence.filter(
    (item) => item.scope === 'property' && item.type === 'job_event'
  );
  const clientNotes = evidence.filter((item) => item.scope === 'client' && item.type === 'note');

  const sections = [
    formatEvidenceSection('Job Notes', jobNotes),
    formatEvidenceSection('Job Events', jobEvents),
    formatEvidenceSection('Property Notes', propertyNotes),
    formatEvidenceSection('Property Events', propertyEvents),
    formatEvidenceSection('Client Notes', clientNotes),
    formatEvidenceSection('Related Vector Matches', vectorEvidence),
  ].filter(Boolean);

  return sections.join('\n\n');
}

export function registerChatRoutes(app: Hono<AppEnv>) {
  app.get('/jobs/:jobId/ai/conversation', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const jobId = c.req.param('jobId');
    const requestedId = c.req.query('conversationId');

    let conversation: ConversationRecord | null = null;
    if (requestedId) {
      conversation = await findConversationById(c.env.D1_DB, tenantId, requestedId);
    } else {
      conversation = await findConversation(c.env.D1_DB, tenantId, jobId, userId);
    }

    if (!conversation || conversation.jobId !== jobId) {
      return c.json({ conversation_id: null, messages: [] }, 200);
    }

    const messages = await c.env.D1_DB.prepare(
      `
      SELECT role, content, created_at, metadata_json
      FROM copilot_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      `.trim()
    )
      .bind(conversation.id)
      .all<MessageRow>();

    return c.json({
      conversation_id: conversation.id,
      messages: (messages.results ?? []).map((row) => ({
        role: row.role,
        content: row.content,
        created_at: row.created_at,
        metadata_json: row.metadata_json ?? null,
      })),
    });
  });

  app.post('/jobs/:jobId/ai/chat', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');

    if (!c.env.OPENAI_API_KEY) {
      return c.json({ error: 'Missing OpenAI API key' }, 500);
    }

    const body = await c.req.json().catch(() => null);
    const message = body?.message;
    const conversationIdInput = body?.conversationId;
    if (typeof message !== 'string' || message.trim().length === 0) {
      return c.json({ error: 'Missing message' }, 400);
    }

    const jobId = c.req.param('jobId');
    let snapshot;
    try {
      snapshot = await getJobContextSnapshot(c.env.D1_DB, tenantId, jobId);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        return c.json({ error: 'Job not found' }, 404);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
    const evidence = await getJobEvidence(c.env.D1_DB, tenantId, jobId);
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
      const embeddingResponse = await fetchOpenAIEmbedding(
        c.env.OPENAI_API_KEY,
        message,
        defaultCopilotConfig.model.embeddingModel
      );
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
            topK: defaultCopilotConfig.retrieval.topK,
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
            topK: defaultCopilotConfig.retrieval.fallbackTopK,
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
        topK: Math.min(defaultCopilotConfig.retrieval.topK, 3),
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

    const evidenceText = formatEvidenceForPrompt(evidence, vectorEvidence);

    const conversationId =
      typeof conversationIdInput === 'string' && conversationIdInput.trim().length > 0
        ? conversationIdInput.trim()
        : crypto.randomUUID();

    const existingConversation = await findConversationById(c.env.D1_DB, tenantId, conversationId);

    if (!existingConversation) {
      await ensureConversation(c.env.D1_DB, {
        id: conversationId,
        tenantId,
        jobId,
        userId,
      });
    } else if (existingConversation.jobId !== jobId) {
      return c.json({ error: 'Conversation does not belong to this job' }, 400);
    }

    const historyResult = await c.env.D1_DB.prepare(
      `
      SELECT role, content, created_at
      FROM copilot_messages
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      `.trim()
    )
      .bind(conversationId, defaultCopilotConfig.retrieval.historyLimit)
      .all<MessageRow>();

    const historyMessages = (historyResult.results ?? []).reverse().map((row) => ({
      role: row.role === 'assistant' ? 'assistant' : 'user',
      content: row.content,
    }));

    const promptVersion = defaultCopilotConfig.prompt.version;
    const modelName = defaultCopilotConfig.model.model;
    const provider = createOpenAIProvider(c.env.OPENAI_API_KEY);

    const wantsStream = body?.stream === true;

    if (wantsStream) {
      if (!provider.stream) {
        return c.json({ error: 'Streaming not supported by provider' }, 500);
      }

      const prompt = buildPrompt(promptVersion, {
        snapshot,
        evidenceText,
        history: historyMessages,
        userMessage: message,
      });

      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      const sendEvent = async (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(payload));
      };

      let fullContent = '';

      try {
        for await (const chunk of provider.stream({
          model: modelName,
          temperature: defaultCopilotConfig.model.temperature,
          topP: defaultCopilotConfig.model.topP,
          maxTokens: defaultCopilotConfig.model.maxTokens,
          responseFormat: defaultCopilotConfig.model.responseFormat,
          messages: prompt,
        })) {
          if (chunk.done) break;
          if (chunk.delta) {
            fullContent += chunk.delta;
            await sendEvent('delta', { delta: chunk.delta });
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Streaming failed';
        await sendEvent('error', { error: message });
        await writer.close();
        return new Response(stream.readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      const parsedResponse = parseResponse({ content: fullContent });
      const citations = parsedResponse.citations;

      const evidenceCitations = evidence.map((item) => ({
        doc_id: item.docId,
        date: item.date ?? null,
        type: item.type,
        snippet: item.text.slice(0, 240),
        author_name: item.authorName ?? null,
        author_email: item.authorEmail ?? null,
      }));

      const evidenceById = new Map(
        evidenceCitations
          .filter((item) => typeof item.doc_id === 'string')
          .map((item) => [item.doc_id as string, item])
      );

      const normalizedCitations =
        citations.length > 0 &&
        citations.every((citation) => {
          if (!citation || typeof citation !== 'object') return false;
          const record = citation as Record<string, unknown>;
          return (
            typeof record.doc_id === 'string' &&
            typeof record.snippet === 'string' &&
            typeof record.type === 'string'
          );
        })
          ? citations.map((citation) => {
              const record = citation as Record<string, unknown>;
              const fallback = evidenceById.get(record.doc_id as string);
              return {
                ...fallback,
                ...record,
              };
            })
          : evidenceCitations;

      const assistantContent = parsedResponse.answer || fullContent;
      const finalAnswer =
        assistantContent.trim().length > 0
          ? assistantContent
          : 'Information not available in the job history.';
      const userMetadata = JSON.stringify({ type: 'user_message' });
      const assistantMetadata = JSON.stringify({
        type: 'assistant_message',
        citations: normalizedCitations,
        evidence: evidence.map((item) => item.docId),
      });

      await saveMessage(c.env.D1_DB, {
        id: crypto.randomUUID(),
        conversationId,
        tenantId,
        jobId,
        userId,
        role: 'user',
        content: message,
        source: 'app',
        model: modelName,
        promptVersion,
        metadataJson: userMetadata,
        contentHash: await sha256(message),
      });

      await saveMessage(c.env.D1_DB, {
        id: crypto.randomUUID(),
        conversationId,
        tenantId,
        jobId,
        userId,
        role: 'assistant',
        content: finalAnswer,
        source: 'app',
        model: modelName,
        promptVersion,
        metadataJson: assistantMetadata,
        contentHash: await sha256(finalAnswer),
      });

      await touchConversation(c.env.D1_DB, conversationId);

      const responsePayload = {
        conversation_id: conversationId,
        answer: finalAnswer,
        citations: normalizedCitations,
        follow_ups: parsedResponse.followUps,
        evidence: evidence.map((item) => ({
          doc_id: item.docId,
          date: item.date,
          type: item.type,
          scope: item.scope,
          text: item.text,
        })),
      };

      await sendEvent('done', responsePayload);
      await writer.close();

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'x-conversation-id': conversationId,
        },
      });
    }

    const orchestratorResponse = await runCopilotOrchestrator(
      { model: provider },
      {
        requestId: crypto.randomUUID(),
        userInput: message,
        context: snapshot,
        evidenceText,
        history: historyMessages,
        config: defaultCopilotConfig,
      }
    );
    const citations = orchestratorResponse.citations;

    const evidenceCitations = evidence.map((item) => ({
      doc_id: item.docId,
      date: item.date ?? null,
      type: item.type,
      snippet: item.text.slice(0, 240),
      author_name: item.authorName ?? null,
      author_email: item.authorEmail ?? null,
    }));

    const evidenceById = new Map(
      evidenceCitations
        .filter((item) => typeof item.doc_id === 'string')
        .map((item) => [item.doc_id as string, item])
    );

    const normalizedCitations =
      citations.length > 0 &&
      citations.every((citation) => {
        if (!citation || typeof citation !== 'object') return false;
        const record = citation as Record<string, unknown>;
        return (
          typeof record.doc_id === 'string' &&
          typeof record.snippet === 'string' &&
          typeof record.type === 'string'
        );
      })
        ? citations.map((citation) => {
            const record = citation as Record<string, unknown>;
            const fallback = evidenceById.get(record.doc_id as string);
            return {
              ...fallback,
              ...record,
            };
          })
        : evidenceCitations;

    const assistantContent = orchestratorResponse.answer;
    const finalAnswer =
      assistantContent.trim().length > 0
        ? assistantContent
        : 'Information not available in the job history.';
    const userMetadata = JSON.stringify({ type: 'user_message' });
    const assistantMetadata = JSON.stringify({
      type: 'assistant_message',
      citations: normalizedCitations,
      evidence: evidence.map((item) => item.docId),
    });

    await saveMessage(c.env.D1_DB, {
      id: crypto.randomUUID(),
      conversationId,
      tenantId,
      jobId,
      userId,
      role: 'user',
      content: message,
      source: 'app',
      model: modelName,
      promptVersion,
      metadataJson: userMetadata,
      contentHash: await sha256(message),
    });

    await saveMessage(c.env.D1_DB, {
      id: crypto.randomUUID(),
      conversationId,
      tenantId,
      jobId,
      userId,
      role: 'assistant',
      content: finalAnswer,
      source: 'app',
      model: modelName,
      promptVersion,
      metadataJson: assistantMetadata,
      contentHash: await sha256(finalAnswer),
    });

    await touchConversation(c.env.D1_DB, conversationId);

    c.header('x-conversation-id', conversationId);

    return c.json(
      {
        conversation_id: conversationId,
        answer: finalAnswer,
        citations: normalizedCitations,
        follow_ups: orchestratorResponse.followUps,
        evidence: evidence.map((item) => ({
          doc_id: item.docId,
          date: item.date,
          type: item.type,
          scope: item.scope,
          text: item.text,
          author_name: item.authorName ?? null,
          author_email: item.authorEmail ?? null,
        })),
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
              fallbackUsed: false,
            }
          : undefined,
      },
      200
    );
  });
}
