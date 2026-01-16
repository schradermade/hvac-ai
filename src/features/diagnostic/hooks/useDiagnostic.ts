import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers';
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

// ============================================================================
// Session Management Hooks
// ============================================================================

const QUERY_KEYS = {
  all: ['diagnostic', 'sessions'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (companyId: string) => [...QUERY_KEYS.lists(), companyId] as const,
  session: (id: string) => [...QUERY_KEYS.all, 'detail', id] as const,
  clientSessions: (companyId: string, clientId: string) =>
    [...QUERY_KEYS.lists(), companyId, 'client', clientId] as const,
};

/**
 * Create a new diagnostic session
 */
export function useCreateSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      mode = 'expert',
      jobId,
      equipmentId,
    }: {
      clientId: string;
      mode?: DiagnosticMode;
      jobId?: string;
      equipmentId?: string;
    }) =>
      diagnosticService.createSession(
        user!.companyId,
        clientId,
        user!.id,
        `${user!.firstName} ${user!.lastName}`,
        mode,
        jobId,
        equipmentId
      ),
    onSuccess: (session) => {
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clientSessions(session.companyId, session.clientId),
      });
      // Set the new session in cache
      queryClient.setQueryData(QUERY_KEYS.session(session.id), session);
    },
  });
}

/**
 * Get a specific diagnostic session
 */
export function useSession(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.session(sessionId),
    queryFn: () => diagnosticService.getSession(sessionId),
    enabled: enabled && !!sessionId,
  });
}

/**
 * Get all diagnostic sessions for a client
 */
export function useSessionsByClient(clientId: string, enabled = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.clientSessions(user?.companyId || '', clientId),
    queryFn: () => diagnosticService.getSessionsByClient(user!.companyId, clientId),
    enabled: enabled && !!clientId && !!user?.companyId,
  });
}

/**
 * Get all diagnostic sessions (for history view)
 */
export function useAllSessions(enabled = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.list(user?.companyId || ''),
    queryFn: () => diagnosticService.getAllSessions(user!.companyId),
    enabled: enabled && !!user?.companyId,
  });
}

/**
 * Add a message to an existing session
 */
export function useAddMessageToSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, request }: { sessionId: string; request: SendMessageRequest }) =>
      diagnosticService.addMessageToSession(
        sessionId,
        request,
        user!.id,
        `${user!.firstName} ${user!.lastName}`
      ),
    onSuccess: (session) => {
      // Update the session in cache
      queryClient.setQueryData(QUERY_KEYS.session(session.id), session);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clientSessions(session.companyId, session.clientId),
      });
    },
  });
}

/**
 * Complete a diagnostic session
 */
export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, summary }: { sessionId: string; summary?: string }) =>
      diagnosticService.completeSession(sessionId, summary),
    onSuccess: (session) => {
      // Update the session in cache
      queryClient.setQueryData(QUERY_KEYS.session(session.id), session);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clientSessions(session.companyId, session.clientId),
      });
    },
  });
}

/**
 * Invite a technician to join a diagnostic session
 */
export function useInviteTechnician() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      technicianId,
      technicianName,
    }: {
      sessionId: string;
      technicianId: string;
      technicianName: string;
    }) =>
      diagnosticService.inviteTechnician(
        sessionId,
        technicianId,
        technicianName,
        user!.id,
        `${user!.firstName} ${user!.lastName}`
      ),
    onSuccess: (session) => {
      // Update the session in cache
      queryClient.setQueryData(QUERY_KEYS.session(session.id), session);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clientSessions(session.companyId, session.clientId),
      });
    },
  });
}

/**
 * Leave a diagnostic session
 */
export function useLeaveSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => diagnosticService.leaveSession(sessionId, user!.id),
    onSuccess: (session) => {
      // Update the session in cache
      queryClient.setQueryData(QUERY_KEYS.session(session.id), session);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.clientSessions(session.companyId, session.clientId),
      });
    },
  });
}
