import { useCallback, useEffect, useState } from 'react';
import type { Message } from '@/features/diagnostic/types';
import { jobCopilotService } from '../services/jobCopilotService';
import type { JobCopilotResponse } from '../types/copilot';

function getSources(response: JobCopilotResponse) {
  if (response.citations.length) {
    return response.citations.map((citation) => ({
      snippet: citation.snippet,
      date: citation.date,
      type: citation.type,
      authorName: (citation as { author_name?: string }).author_name,
      authorEmail: (citation as { author_email?: string }).author_email,
    }));
  }

  if (response.evidence?.length) {
    return response.evidence.map((item) => ({
      snippet: item.text,
      date: item.date,
      type: item.type,
      authorName: (item as { author_name?: string }).author_name,
      authorEmail: (item as { author_email?: string }).author_email,
    }));
  }

  return [];
}

function createMessage({
  id,
  content,
  role,
  senderId,
  senderName,
  senderRole,
  isLoading,
  sources,
}: Partial<Message> & Pick<Message, 'id' | 'content' | 'role'>): Message {
  return {
    id,
    content,
    role,
    timestamp: new Date(),
    senderId,
    senderName,
    senderRole,
    isLoading,
    sources,
  };
}

export function useJobCopilot(jobId: string, userId: string, userName?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!jobId) return;
      try {
        const response = await jobCopilotService.getConversation(jobId, conversationId);
        if (!isMounted) return;
        if (response.conversation_id) {
          setConversationId(response.conversation_id);
        }
        const restored = response.messages.map((item, index) => {
          let sources;
          if (item.metadata_json && item.role === 'assistant') {
            try {
              const metadata = JSON.parse(item.metadata_json) as { citations?: unknown };
              if (Array.isArray(metadata.citations)) {
                sources = metadata.citations
                  .map((citation) => {
                    if (!citation || typeof citation !== 'object') return null;
                    const record = citation as Record<string, unknown>;
                    if (typeof record.snippet !== 'string') return null;
                    return {
                      snippet: record.snippet as string,
                      date: typeof record.date === 'string' ? record.date : undefined,
                      type: typeof record.type === 'string' ? record.type : undefined,
                      authorName:
                        typeof record.author_name === 'string' ? record.author_name : undefined,
                      authorEmail:
                        typeof record.author_email === 'string' ? record.author_email : undefined,
                    };
                  })
                  .filter(Boolean);
              }
            } catch {
              sources = undefined;
            }
          }
          return createMessage({
            id: `history-${index}-${item.created_at}`,
            content: item.content,
            role: item.role === 'assistant' ? 'assistant' : 'user',
            senderId: item.role === 'assistant' ? 'ai' : userId,
            senderName: item.role === 'assistant' ? 'HVACOps Copilot' : userName,
            senderRole: item.role === 'assistant' ? 'ai' : 'primary',
            sources,
          });
        });
        setMessages(restored);
      } catch {
        // Leave conversation empty if load fails.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [conversationId, jobId, userId, userName]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !jobId) {
        return;
      }

      const userMessage = createMessage({
        id: `user-${Date.now()}`,
        content,
        role: 'user',
        senderId: userId,
        senderName: userName,
        senderRole: 'primary',
      });

      const loadingMessage = createMessage({
        id: `ai-${Date.now()}`,
        content: 'Thinking...',
        role: 'assistant',
        senderId: 'ai',
        senderName: 'HVACOps Copilot',
        senderRole: 'ai',
        isLoading: true,
      });

      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setIsSending(true);

      try {
        const response = await jobCopilotService.sendMessageStreaming({
          jobId,
          message: content,
          conversationId,
          onDelta: (delta) => {
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== loadingMessage.id) return msg;
                const nextContent =
                  msg.content === 'Thinking...' ? delta : `${msg.content}${delta}`;
                return {
                  ...msg,
                  content: nextContent,
                  isLoading: false,
                };
              })
            );
          },
        });

        const assistantMessage = createMessage({
          id: `ai-${Date.now()}-final`,
          content: response.answer,
          role: 'assistant',
          senderId: 'ai',
          senderName: 'HVACOps Copilot',
          senderRole: 'ai',
          sources: getSources(response),
        });

        if (response.conversation_id) {
          setConversationId(response.conversation_id);
        }

        setFollowUps(response.follow_ups ?? []);
        setMessages((prev) => {
          const withoutLoading = prev.filter((msg) => msg.id !== loadingMessage.id);
          return [...withoutLoading, assistantMessage];
        });
      } catch {
        const assistantMessage = createMessage({
          id: `ai-${Date.now()}-error`,
          content:
            'Copilot is unavailable right now. Please try again in a moment or check your connection.',
          role: 'assistant',
          senderId: 'ai',
          senderName: 'HVACOps Copilot',
          senderRole: 'ai',
        });

        setMessages((prev) => {
          const withoutLoading = prev.filter((msg) => msg.id !== loadingMessage.id);
          return [...withoutLoading, assistantMessage];
        });
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, jobId, userId, userName]
  );

  return {
    messages,
    isSending,
    sendMessage,
    followUps,
    conversationId,
  };
}
