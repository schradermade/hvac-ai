import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreateSession, useSession, useAddMessageToSession } from '../hooks/useDiagnostic';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { SessionContextHeader } from '../components/SessionContextHeader';
import { spacing } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DiagnosticChat'>;

/**
 * DiagnosticChatScreen
 *
 * Session-based diagnostic chat with full job-client-equipment context.
 * Creates or resumes diagnostic sessions tied to specific clients and optionally jobs/equipment.
 *
 * Features:
 * - Context-aware AI assistant with client/job/equipment info
 * - Persistent sessions with message history
 * - Session completion and summary generation
 * - Seamless integration with job workflow
 */
export function DiagnosticChatScreen({ route }: Props) {
  const { clientId, jobId, equipmentId, sessionId: existingSessionId } = route.params;

  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(existingSessionId);

  // Session management
  const createSessionMutation = useCreateSession();
  const { data: session, isLoading: sessionLoading } = useSession(
    activeSessionId || '',
    !!activeSessionId
  );
  const addMessageMutation = useAddMessageToSession();

  // Create session if needed
  useEffect(() => {
    if (!activeSessionId && !createSessionMutation.isPending && !createSessionMutation.isSuccess) {
      createSessionMutation.mutate(
        { clientId, jobId, equipmentId, mode: 'expert' },
        {
          onSuccess: (newSession) => {
            setActiveSessionId(newSession.id);
          },
        }
      );
    }
  }, [activeSessionId, clientId, jobId, equipmentId, createSessionMutation]);

  const handleSendMessage = (content: string) => {
    if (!activeSessionId || !content.trim()) return;

    addMessageMutation.mutate({
      sessionId: activeSessionId,
      request: { content, mode: 'expert' },
    });
  };

  // Loading state
  if (sessionLoading || !session) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Starting AI diagnostic session...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <SessionContextHeader clientId={clientId} jobId={jobId} equipmentId={equipmentId} />

      <MessageList messages={session.messages} />
      <ChatInput
        onSend={handleSendMessage}
        disabled={addMessageMutation.isPending}
        placeholder="Ask about diagnostics, troubleshooting, or calculations..."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF', // Light indigo background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
});
