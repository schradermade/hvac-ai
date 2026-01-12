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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={28} color="#FFFFFF" />
              <Text style={styles.heroTitle}>AI</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{sessions.length}</Text>
              </View>
            </View>
            <Text style={styles.subtitleText}>Diagnostic history and conversations</Text>
          </View>

          {/* Brand Header - Top Right */}
          <View style={styles.brandHeader}>
            <View style={styles.brandLogoContainer}>
              <Ionicons name="snow" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>HVAC AI</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color={isSearchFocused ? colors.textPrimary : '#FFFFFF'}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.inlineSearchInput, isSearchFocused && styles.inlineSearchInputFocused]}
              placeholder="Search AI history..."
              placeholderTextColor={isSearchFocused ? colors.textMuted : '#FFFFFF'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
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
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={isSearchFocused ? colors.textMuted : '#FFFFFF'}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.quickFindButton}
            onPress={() => setShowSearchModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={20} color="#FFFFFF" />
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
      </View>

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
            <Text style={styles.emptyResultsTitle}>No AI history found</Text>
            <Text style={styles.emptyResultsText}>
              {searchQuery
                ? `No AI history matches "${searchQuery}"`
                : 'Try adjusting your filters'}
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
            <Text style={styles.modalTitle}>Find AI Session</Text>
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
                  <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>
                  {searchQuery
                    ? `No AI history matches "${searchQuery}"`
                    : 'Start typing to search'}
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
    backgroundColor: '#6366F1',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: '#6366F1',
    borderBottomWidth: 0,
    gap: spacing[3],
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  heroContent: {
    flex: 1,
    gap: spacing[2],
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  brandLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  subtitleText: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.medium,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
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
  searchIcon: {
    position: 'absolute',
    left: spacing[4],
    top: 18,
    zIndex: 1,
  },
  inlineSearchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.base,
    paddingLeft: spacing[12],
    paddingRight: spacing[12],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 56,
    ...shadows.sm,
  },
  inlineSearchInputFocused: {
    backgroundColor: '#FFFFFF',
    color: colors.textPrimary,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  clearButton: {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFindButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: '#FFFFFF',
  },
  filterChipTextActive: {
    color: '#6366F1',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#D4D7FB',
    backgroundColor: '#EEF2FF',
  },
  modalClose: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#6366F1',
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
    backgroundColor: '#EEF2FF',
  },
  modalSearchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: '#D4D7FB',
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
    backgroundColor: '#D4D7FB',
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
