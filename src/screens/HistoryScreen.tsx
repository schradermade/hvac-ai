import React, { useMemo } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState, Spinner, Badge } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useAllSessions } from '@/features/diagnostic';
import { useClientList } from '@/features/clients';
import type { RootStackParamList } from '@/navigation/types';
import type { DiagnosticSession } from '@/features/diagnostic/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * HistoryScreen
 *
 * Shows diagnostic session history with:
 * - All diagnostic sessions grouped by client
 * - Session details (date, client, job, equipment, message count)
 * - Tap to resume a session
 * - Completed sessions show summary
 */
export function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { data: sessionsData, isLoading: sessionsLoading } = useAllSessions();
  const { data: clientsData } = useClientList();

  const clients = useMemo(() => clientsData?.items || [], [clientsData?.items]);
  // Only show sessions with at least 1 message
  const sessions = useMemo(
    () => (sessionsData?.items || []).filter((session) => session.messages.length > 0),
    [sessionsData?.items]
  );

  // Group sessions by client
  const groupedSessions = useMemo(() => {
    const grouped: Record<string, DiagnosticSession[]> = {};

    sessions.forEach((session) => {
      if (!grouped[session.clientId]) {
        grouped[session.clientId] = [];
      }
      grouped[session.clientId]?.push(session);
    });

    return grouped;
  }, [sessions]);

  const handleSessionPress = (session: DiagnosticSession) => {
    navigation.navigate('DiagnosticChat', {
      clientId: session.clientId,
      jobId: session.jobId,
      equipmentId: session.equipmentId,
      sessionId: session.id,
    });
  };

  if (sessionsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Spinner message="Loading diagnostic history..." />
      </SafeAreaView>
    );
  }

  if (sessions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <EmptyState
            title="No diagnostic history"
            description="Your past diagnostics and conversations will appear here for easy reference"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diagnostic History</Text>
        <Text style={styles.subtitle}>
          {sessions.length} session{sessions.length === 1 ? '' : 's'}
        </Text>
      </View>

      <FlatList
        data={Object.entries(groupedSessions)}
        keyExtractor={([clientId]) => clientId}
        renderItem={({ item: [clientId, clientSessions] }) => {
          const client = clients.find((c) => c.id === clientId);

          return (
            <View style={styles.clientGroup}>
              <View style={styles.clientHeader}>
                <Text style={styles.clientName}>{client?.name || 'Unknown Client'}</Text>
                <Badge variant="neutral">{String(clientSessions.length)}</Badge>
              </View>

              {clientSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => handleSessionPress(session)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <View>
                        <Text style={styles.sessionDate}>
                          {new Date(session.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text style={styles.sessionTime}>
                          {new Date(session.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      {session.completedAt && <Badge variant="success">Completed</Badge>}
                      {!session.completedAt && <Badge variant="info">In Progress</Badge>}
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>

                  {session.jobId && <Text style={styles.sessionMeta}>📋 Linked to job</Text>}
                  {session.equipmentId && (
                    <Text style={styles.sessionMeta}>⚙️ Equipment diagnostic</Text>
                  )}

                  <View style={styles.sessionFooter}>
                    <Text style={styles.messageCount}>
                      {session.messages.length} message{session.messages.length === 1 ? '' : 's'}
                    </Text>
                    {session.summary && (
                      <Text style={styles.summary} numberOfLines={1}>
                        {session.summary}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing[4],
  },
  clientGroup: {
    marginBottom: spacing[6],
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },
  clientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  sessionDate: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  sessionTime: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[0.5] || 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
  },
  sessionMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  sessionFooter: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  summary: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
