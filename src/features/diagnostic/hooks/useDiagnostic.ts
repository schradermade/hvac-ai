import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { diagnosticService } from '../services/diagnosticService';
import type { Message, SendMessageRequest, DiagnosticMode, EquipmentContext } from '../types';

/**
 * Hook for managing diagnostic chat state and sending messages
 *
 * Provides:
 * - Messages array with optimistic updates
 * - Send message function with loading states
 * - Equipment context management
 */
export function useDiagnosticChat(initialMode: DiagnosticMode = 'expert') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<DiagnosticMode>(initialMode);
  const [equipmentContext, setEquipmentContext] = useState<EquipmentContext | undefined>();

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: (request: SendMessageRequest) => diagnosticService.sendMessage(request),
    onMutate: async (request) => {
      // Optimistically add user message
      const userMessage: Message = {
        id: `temp_${Date.now()}`,
        role: 'user',
        content: request.content,
        timestamp: new Date(),
      };

      // Add loading message for AI response
      const loadingMessage: Message = {
        id: `loading_${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);

      return { userMessage, loadingMessage };
    },
    onSuccess: (aiMessage, _variables, context) => {
      // Replace loading message with actual AI response
      setMessages((prev) =>
        prev.map((msg) => (msg.id === context?.loadingMessage.id ? aiMessage : msg))
      );
    },
    onError: (_error, _variables, context) => {
      // Remove loading message and show error
      setMessages((prev) => prev.filter((msg) => msg.id !== context?.loadingMessage.id));

      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  /**
   * Send a message in the chat
   */
  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      sendMessageMutation.mutate({
        content,
        mode,
        equipmentContext,
      });
    },
    [mode, equipmentContext, sendMessageMutation]
  );

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading: sendMessageMutation.isPending,
    mode,
    setMode,
    equipmentContext,
    setEquipmentContext,
  };
}
