import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, Spinner, Badge } from '@/components/ui';
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
  const [showSearchModal, setShowSearchModal] = useState(false);
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

  if (sessions.length === 0 && !hasAnySessions) {
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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.inlineSearchInput}
              placeholder="Search sessions..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.6}
                hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
              >
                <View style={styles.clearButtonInner}>
                  <Text style={styles.clearButtonIcon}>✕</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.quickFindButtonCompact}
            onPress={() => setShowSearchModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
            onPress={() => setStatusFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'in_progress' && styles.filterChipActive]}
            onPress={() => setStatusFilter('in_progress')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === 'in_progress' && styles.filterChipTextActive,
              ]}
            >
              In Progress
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'completed' && styles.filterChipActive]}
            onPress={() => setStatusFilter('completed')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === 'completed' && styles.filterChipTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Session Count */}
        <View style={styles.sessionCountContainer}>
          <Text style={styles.sessionCount}>
            {sessions.length} session{sessions.length === 1 ? '' : 's'}
          </Text>
        </View>
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

                  {session.jobId && (
                    <View style={styles.sessionMetaRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.sessionMeta}>Linked to job</Text>
                    </View>
                  )}
                  {session.equipmentId && (
                    <View style={styles.sessionMetaRow}>
                      <Ionicons name="construct-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.sessionMeta}>Equipment diagnostic</Text>
                    </View>
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
        ListEmptyComponent={
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsTitle}>No sessions found</Text>
            <Text style={styles.emptyResultsText}>
              {searchQuery ? `No sessions match "${searchQuery}"` : 'Try adjusting your filters'}
            </Text>
          </View>
        }
        contentContainerStyle={sessions.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Find Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
              }}
            >
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Find Session</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          <View style={styles.modalSearchContainer}>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by client name..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item: session }) => {
              const client = clients.find((c) => c.id === session.clientId);
              return (
                <TouchableOpacity
                  style={styles.sessionListItem}
                  onPress={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                    handleSessionPress(session);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionListItemContent}>
                    <Text style={styles.sessionListItemName}>
                      {client?.name || 'Unknown Client'}
                    </Text>
                    <Text style={styles.sessionListItemDetails}>
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
                    <Text style={styles.sessionListItemAddress}>
                      {session.messages.length} message{session.messages.length === 1 ? '' : 's'}
                      {session.jobId && ' • Linked to job'}
                    </Text>
                  </View>
                  <View style={styles.sessionListItemBadge}>
                    {session.completedAt ? (
                      <Badge variant="success">Completed</Badge>
                    ) : (
                      <Badge variant="info">In Progress</Badge>
                    )}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>
                  {searchQuery ? `No sessions match "${searchQuery}"` : 'Start typing to search'}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: 0,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  inlineSearchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[4],
    paddingRight: spacing[12],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
  },
  clearButton: {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  clearButtonIcon: {
    fontSize: 18,
    color: colors.surface,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 18,
    textAlign: 'center',
  },
  quickFindButtonCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.base,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    minHeight: 56,
    minWidth: 56,
    ...shadows.sm,
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingTop: spacing[3],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  sessionCountContainer: {
    alignItems: 'flex-end',
    paddingTop: spacing[3],
  },
  sessionCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  emptyListContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
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
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[1],
  },
  sessionMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primaryLight,
  },
  modalClose: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    minWidth: 60,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalPlaceholder: {
    width: 60,
  },
  modalSearchContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    backgroundColor: colors.primaryLight,
  },
  modalSearchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
  },
  modalListContent: {
    paddingBottom: spacing[4],
  },
  sessionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surface,
    minHeight: 80,
  },
  sessionListItemContent: {
    flex: 1,
  },
  sessionListItemBadge: {
    marginRight: spacing[2],
  },
  sessionListItemName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  sessionListItemDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  sessionListItemAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptySearch: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
