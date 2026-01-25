import { useCallback, useState } from 'react';
import type { Message } from '@/features/diagnostic/types';
import { jobCopilotService } from '../services/jobCopilotService';
import type { JobCopilotResponse } from '../types/copilot';

function formatCitations(response: JobCopilotResponse): string {
  if (!response.citations.length) {
    return '';
  }

  const lines = response.citations.map((citation) => `- ${citation.snippet}`);
  return `\n\nSources:\n${lines.join('\n')}`;
}

function createMessage({
  id,
  content,
  role,
  senderId,
  senderName,
  senderRole,
  isLoading,
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
  };
}

export function useJobCopilot(jobId: string, userId: string, userName?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);

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
        const response = await jobCopilotService.sendMessage(jobId, content);
        const assistantMessage = createMessage({
          id: `ai-${Date.now()}-final`,
          content: `${response.answer}${formatCitations(response)}`,
          role: 'assistant',
          senderId: 'ai',
          senderName: 'HVACOps Copilot',
          senderRole: 'ai',
        });

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
    [jobId, userId, userName]
  );

  return {
    messages,
    isSending,
    sendMessage,
    followUps,
  };
}
