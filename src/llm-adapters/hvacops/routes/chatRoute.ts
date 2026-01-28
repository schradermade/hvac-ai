import { Hono } from 'hono';
import { getJobContextSnapshot, JobNotFoundError } from '../context/buildContext';
import { getJobEvidence } from '../context/buildEvidence';
import {
  fetchOpenAIEmbedding,
  queryVectorize,
  queryVectorizeWithFilterCandidates,
  toEvidenceChunks,
} from '../retrieval/vectorizeClient';
import { buildSystemPrompt, callOpenAI } from '../services/ai';
import { defaultCopilotConfig } from '../../../llm-core/config/defaults';
import { parseResponse } from '../../../llm-core/parsing/responseParser';
import type { AppEnv } from '../../../server/copilot/workerTypes';

type ConversationRow = {
  id: string;
  tenant_id: string;
  job_id: string;
  user_id: string;
};

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

    let conversation: ConversationRow | null = null;
    if (requestedId) {
      conversation = await c.env.D1_DB.prepare(
        `
        SELECT id, tenant_id, job_id, user_id
        FROM copilot_conversations
        WHERE tenant_id = ? AND id = ?
        LIMIT 1
        `.trim()
      )
        .bind(tenantId, requestedId)
        .first<ConversationRow>();
    } else {
      conversation = await c.env.D1_DB.prepare(
        `
        SELECT id, tenant_id, job_id, user_id
        FROM copilot_conversations
        WHERE tenant_id = ? AND job_id = ? AND user_id = ?
        ORDER BY updated_at DESC
        LIMIT 1
        `.trim()
      )
        .bind(tenantId, jobId, userId)
        .first<ConversationRow>();
    }

    if (!conversation || conversation.job_id !== jobId) {
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

    const existingConversation = await c.env.D1_DB.prepare(
      `
      SELECT id, tenant_id, job_id, user_id
      FROM copilot_conversations
      WHERE tenant_id = ? AND id = ?
      LIMIT 1
      `.trim()
    )
      .bind(tenantId, conversationId)
      .first<ConversationRow>();

    if (!existingConversation) {
      await c.env.D1_DB.prepare(
        `
        INSERT INTO copilot_conversations (id, tenant_id, job_id, user_id)
        VALUES (?, ?, ?, ?)
        `.trim()
      )
        .bind(conversationId, tenantId, jobId, userId)
        .run();
    } else if (existingConversation.job_id !== jobId) {
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
    const openAiPayload: Record<string, unknown> = {
      model: defaultCopilotConfig.model.model,
      temperature: defaultCopilotConfig.model.temperature,
      response_format: { type: defaultCopilotConfig.model.responseFormat },
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        {
          role: 'system',
          content: `Structured context:\n${JSON.stringify(
            snapshot
          )}\n\nEvidence (labeled sections):\n${evidenceText}`,
        },
        ...historyMessages,
        { role: 'user', content: message },
      ],
    };

    if (defaultCopilotConfig.model.topP !== undefined) {
      openAiPayload.top_p = defaultCopilotConfig.model.topP;
    }

    if (defaultCopilotConfig.model.maxTokens !== undefined) {
      openAiPayload.max_tokens = defaultCopilotConfig.model.maxTokens;
    }

    const wantsStream = body?.stream === true;

    if (wantsStream) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      const sendEvent = async (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(payload));
      };

      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${c.env.OPENAI_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ...openAiPayload, stream: true }),
      });

      if (!openAiResponse.ok || !openAiResponse.body) {
        const errorText = await openAiResponse.text();
        await sendEvent('error', { error: errorText || 'Streaming failed' });
        await writer.close();
        return new Response(stream.readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      const reader = openAiResponse.body.getReader();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const line = chunk.split('\n').find((entry) => entry.trim().startsWith('data: '));
          if (!line) continue;
          const payload = line.replace(/^data:\s*/, '').trim();
          if (payload === '[DONE]') {
            buffer = '';
            break;
          }
          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              await sendEvent('delta', { delta });
            }
          } catch {
            // ignore malformed chunks
          }
        }
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

      await c.env.D1_DB.prepare(
        `
        INSERT INTO copilot_messages (
          id, conversation_id, tenant_id, job_id, user_id, role, content,
          source, model, prompt_version, metadata_json, content_hash
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `.trim()
      )
        .bind(
          crypto.randomUUID(),
          conversationId,
          tenantId,
          jobId,
          userId,
          'user',
          message,
          'app',
          openAiPayload.model,
          promptVersion,
          userMetadata,
          await sha256(message)
        )
        .run();

      await c.env.D1_DB.prepare(
        `
        INSERT INTO copilot_messages (
          id, conversation_id, tenant_id, job_id, user_id, role, content,
          source, model, prompt_version, metadata_json, content_hash
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `.trim()
      )
        .bind(
          crypto.randomUUID(),
          conversationId,
          tenantId,
          jobId,
          userId,
          'assistant',
          finalAnswer,
          'app',
          openAiPayload.model,
          promptVersion,
          assistantMetadata,
          await sha256(finalAnswer)
        )
        .run();

      await c.env.D1_DB.prepare(
        `
        UPDATE copilot_conversations
        SET updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        WHERE id = ?
        `.trim()
      )
        .bind(conversationId)
        .run();

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

    const aiResponse = await callOpenAI(c.env.OPENAI_API_KEY, openAiPayload);
    const content = aiResponse.choices[0]?.message?.content ?? '';
    const parsedResponse = parseResponse({ content });
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

    const assistantContent = parsedResponse.answer || content;
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

    await c.env.D1_DB.prepare(
      `
      INSERT INTO copilot_messages (
        id, conversation_id, tenant_id, job_id, user_id, role, content,
        source, model, prompt_version, metadata_json, content_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `.trim()
    )
      .bind(
        crypto.randomUUID(),
        conversationId,
        tenantId,
        jobId,
        userId,
        'user',
        message,
        'app',
        openAiPayload.model,
        promptVersion,
        userMetadata,
        await sha256(message)
      )
      .run();

    await c.env.D1_DB.prepare(
      `
      INSERT INTO copilot_messages (
        id, conversation_id, tenant_id, job_id, user_id, role, content,
        source, model, prompt_version, metadata_json, content_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `.trim()
    )
      .bind(
        crypto.randomUUID(),
        conversationId,
        tenantId,
        jobId,
        userId,
        'assistant',
        finalAnswer,
        'app',
        openAiPayload.model,
        promptVersion,
        assistantMetadata,
        await sha256(finalAnswer)
      )
      .run();

    await c.env.D1_DB.prepare(
      `
      UPDATE copilot_conversations
      SET updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      WHERE id = ?
      `.trim()
    )
      .bind(conversationId)
      .run();

    c.header('x-conversation-id', conversationId);

    return c.json(
      {
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
