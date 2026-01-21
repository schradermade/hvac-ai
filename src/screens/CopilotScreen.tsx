import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Spinner, Badge, SectionHeader, SearchInput, FilterPills } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useAllSessions } from '@/features/diagnostic';
import { useClientList } from '@/features/clients';
import type { RootStackParamList } from '@/navigation/types';
import type { DiagnosticSession } from '@/features/diagnostic/types';

type FilterStatus = 'all' | 'in_progress' | 'completed';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const clients = useMemo(() => clientsData?.items || [], [clientsData?.items]);

  // Only show sessions with at least 1 message, then apply filters
  const sessions = useMemo(() => {
    let filtered = (sessionsData?.items || []).filter((session) => session.messages.length > 0);

    // Apply status filter
    if (statusFilter === 'in_progress') {
      filtered = filtered.filter((s) => !s.completedAt);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((s) => s.completedAt);
    }

    // Apply search filter on client name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((session) => {
        const client = clients.find((c) => c.id === session.clientId);
        return client?.name.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [sessionsData?.items, statusFilter, searchQuery, clients]);

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

  const hasAnySessions =
    (sessionsData?.items || []).filter((s) => s.messages.length > 0).length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <SectionHeader
        icon="sparkles"
        title="Copilot"
        metadata={{
          icon: 'chatbubbles-outline',
          text: 'Diagnostic history and conversations',
        }}
        variant="indigo"
        count={sessions.length}
        style={styles.header}
      >
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search AI history..."
          />
        </View>

        <FilterPills
          items={[
            {
              id: 'all',
              label: 'All',
              active: statusFilter === 'all',
              onPress: () => setStatusFilter('all'),
            },
            {
              id: 'in_progress',
              label: 'In Progress',
              active: statusFilter === 'in_progress',
              onPress: () => setStatusFilter('in_progress'),
            },
            {
              id: 'completed',
              label: 'Completed',
              active: statusFilter === 'completed',
              onPress: () => setStatusFilter('completed'),
            },
          ]}
          contentContainerStyle={styles.filterChips}
          variant="indigo"
        />
      </SectionHeader>

      <FlatList
        style={styles.flatListContainer}
        data={Object.entries(groupedSessions)}
        keyExtractor={([clientId]) => clientId}
        renderItem={({ item: [clientId, clientSessions] }) => {
          const client = clients.find((c) => c.id === clientId);

          return (
            <View style={styles.clientGroup}>
              <View style={styles.clientHeader}>
                <Text style={styles.clientName}>{client?.name || 'Unknown Client'}</Text>
                <View style={styles.clientCountBadge}>
                  <Text style={styles.clientCountBadgeText}>{String(clientSessions.length)}</Text>
                </View>
              </View>

              {clientSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => handleSessionPress(session)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionCardContent}>
                    {/* Icon Container */}
                    <View style={styles.sessionIconContainer}>
                      <Ionicons name="chatbubbles" size={24} color="#6366F1" />
                    </View>

                    {/* Session Content */}
                    <View style={styles.sessionContent}>
                      <Text style={styles.sessionDate}>
                        {new Date(session.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(session.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>

                      <View style={styles.sessionMetaContainer}>
                        {session.jobId && (
                          <View style={styles.sessionMetaRow}>
                            <Ionicons
                              name="document-text-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.sessionMeta}>Linked to job</Text>
                          </View>
                        )}
                        {session.equipmentId && (
                          <View style={styles.sessionMetaRow}>
                            <Ionicons
                              name="construct-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.sessionMeta}>Equipment diagnostic</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.sessionFooter}>
                        <Text style={styles.messageCount}>
                          {session.messages.length} message
                          {session.messages.length === 1 ? '' : 's'}
                        </Text>
                      </View>

                      {session.summary && (
                        <Text style={styles.summary} numberOfLines={2}>
                          {session.summary}
                        </Text>
                      )}
                    </View>

                    {/* Right Side: Badge at top, Chevron centered */}
                    <View style={styles.sessionRightSide}>
                      {session.completedAt ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="info">In Progress</Badge>
                      )}
                      <View style={styles.chevronContainer}>
                        <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsTitle}>
              {!hasAnySessions ? 'No diagnostic history' : 'No AI history found'}
            </Text>
            <Text style={styles.emptyResultsText}>
              {!hasAnySessions
                ? 'Your past diagnostics and conversations will appear here for easy reference'
                : searchQuery
                  ? `No AI history matches "${searchQuery}"`
                  : 'Try adjusting your filters'}
            </Text>
          </View>
        }
        contentContainerStyle={sessions.length === 0 ? styles.emptyListContent : styles.listContent}
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
  header: {
    backgroundColor: '#6366F1',
    borderBottomWidth: 0,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  filterChips: {
    paddingTop: 0,
  },
  flatListContainer: {
    backgroundColor: '#9B9EF6',
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    backgroundColor: '#9B9EF6',
  },
  emptyListContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    backgroundColor: '#9B9EF6',
  },
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyResultsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  emptyResultsText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  clientGroup: {
    marginBottom: spacing[6],
    backgroundColor: '#6366F1',
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  clientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  clientCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientCountBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  sessionCard: {
    backgroundColor: '#F5F6FE',
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: '#D4D7FB',
    shadowColor: '#9B9EF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sessionCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    minHeight: 140,
  },
  sessionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.base,
    backgroundColor: '#6366F1' + '15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  sessionContent: {
    flex: 1,
    gap: spacing[2],
  },
  sessionRightSide: {
    flex: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing[2],
  },
  chevronContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  sessionMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  sessionMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  sessionFooter: {
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: '#D4D7FB',
    width: '75%',
  },
  messageCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  summary: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: spacing[1],
  },
});
