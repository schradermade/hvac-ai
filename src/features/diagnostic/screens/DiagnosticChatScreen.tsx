import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreateSession, useSession, useAddMessageToSession } from '../hooks/useDiagnostic';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { colors, spacing, typography } from '@/components/ui';
import { useClient } from '@/features/clients';
import { useJob } from '@/features/jobs';
import { useEquipment } from '@/features/equipment';
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

  // Fetch context data
  const { data: client } = useClient(clientId);
  const { data: job } = useJob(jobId || '');
  const { data: equipment } = useEquipment(equipmentId || '');

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Starting diagnostic session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Context Header */}
      <View style={styles.contextHeader}>
        <Text style={styles.contextTitle}>{client?.name || 'Loading client...'}</Text>
        {job && (
          <Text style={styles.contextSubtitle}>
            Job: {job.type} - {new Date(job.scheduledStart).toLocaleDateString()}
          </Text>
        )}
        {equipment && (
          <Text style={styles.contextSubtitle}>
            Equipment: {equipment.name} ({equipment.manufacturer})
          </Text>
        )}
      </View>

      <MessageList messages={session.messages} />
      <ChatInput
        onSend={handleSendMessage}
        disabled={addMessageMutation.isPending}
        placeholder="Ask about diagnostics, troubleshooting, or calculations..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  contextHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contextTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  contextSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
