import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreateSession, useSession, useAddMessageToSession } from '../hooks/useDiagnostic';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { colors, spacing, typography } from '@/components/ui';
import { useClient } from '@/features/clients';
import { useJob } from '@/features/jobs';
import { useEquipment } from '@/features/equipment';
import type { RootStackParamList } from '@/navigation/types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

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

  const toggleHeader = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsHeaderExpanded(!isHeaderExpanded);
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
      {/* Context Header - Collapsible */}
      <View style={styles.contextHeader}>
        {!isHeaderExpanded ? (
          // Collapsed: Big prominent button
          <TouchableOpacity style={styles.toggleButton} onPress={toggleHeader} activeOpacity={0.7}>
            <View style={styles.collapsedHeader}>
              <View style={styles.collapsedContent}>
                <Text style={styles.collapsedClientName}>{client?.name || 'Loading...'}</Text>
                {job && (
                  <View style={styles.jobBadge}>
                    <Text style={styles.jobBadgeText}>{job.type.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.chevronContainer}>
                <Text style={styles.chevron}>▼</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          // Expanded: Details with collapse button
          <View>
            {/* Collapse button positioned at same spot as collapsed button */}
            <TouchableOpacity
              style={styles.floatingCollapseButton}
              onPress={toggleHeader}
              activeOpacity={0.7}
            >
              <View style={styles.chevronContainer}>
                <Text style={styles.chevron}>▲</Text>
              </View>
            </TouchableOpacity>

            {/* Client Info */}
            <View style={styles.infoSection}>
              <View>
                <Text style={styles.sectionLabel}>CLIENT</Text>
                <Text style={styles.contextTitle}>{client?.name || 'Loading client...'}</Text>
              </View>
              {client && (
                <>
                  <Text style={styles.infoText}>📞 {client.phone}</Text>
                  <Text style={styles.infoText}>
                    📍 {client.address}, {client.city}, {client.state} {client.zipCode}
                  </Text>
                  {client.serviceNotes && (
                    <Text style={styles.notesText} numberOfLines={2}>
                      Note: {client.serviceNotes}
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Job Info */}
            {job && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionLabel}>JOB</Text>
                <Text style={styles.jobTitle}>
                  {job.type.toUpperCase()} - {job.status.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.infoText}>
                  🕐{' '}
                  {new Date(job.scheduledStart).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(job.scheduledEnd).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.infoText}>📋 {job.description}</Text>
                {job.notes && <Text style={styles.notesText}>Note: {job.notes}</Text>}
              </View>
            )}

            {/* Equipment Info */}
            {equipment && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionLabel}>EQUIPMENT</Text>
                <Text style={styles.equipmentTitle}>{equipment.name}</Text>
                <Text style={styles.infoText}>
                  {equipment.manufacturer}{' '}
                  {equipment.modelNumber ? `• ${equipment.modelNumber}` : ''}
                </Text>
                <Text style={styles.infoText}>
                  {equipment.systemType.replace(/_/g, ' ').toUpperCase()}
                  {equipment.tonnage ? ` • ${equipment.tonnage} ton` : ''}
                  {equipment.refrigerant ? ` • ${equipment.refrigerant}` : ''}
                </Text>
                {equipment.serialNumber && (
                  <Text style={styles.infoText}>S/N: {equipment.serialNumber}</Text>
                )}
                {equipment.location && <Text style={styles.infoText}>📍 {equipment.location}</Text>}
              </View>
            )}

            {/* Divider line at bottom when expanded */}
            <View style={styles.expandedDivider} />
          </View>
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
    backgroundColor: 'transparent',
    paddingBottom: spacing[3],
  },
  expandedDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing[3],
  },
  toggleButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[5],
    minHeight: 70,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginHorizontal: spacing[2],
    marginTop: spacing[2],
    borderWidth: 2,
    borderColor: colors.primary + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingCollapseButton: {
    position: 'absolute',
    top: spacing[2] + spacing[5], // Match toggleButton marginTop + paddingTop
    right: spacing[2] + spacing[4], // Match toggleButton marginHorizontal + paddingHorizontal
    zIndex: 10,
    padding: 0,
  },
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[2],
  },
  collapsedClientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  jobBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  jobBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  chevronContainer: {
    minWidth: 50,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
  },
  chevron: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  contextTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  infoSection: {
    marginTop: spacing[4],
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  jobTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  equipmentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing[1],
    lineHeight: 20,
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing[2],
    lineHeight: 18,
  },
});
