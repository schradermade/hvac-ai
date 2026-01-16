import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Modal, TextInput, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, Button, Spinner, HeroSection } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useTodaysJobs, useCreateJob } from '../hooks/useJobs';
import { useMyJobs } from '../hooks/useJobAssignment';
import { JobCard } from '../components/JobCard';
import { JobForm } from '../components/JobForm';
import type { JobFormData, Job } from '../types';
import type { RootStackParamList } from '@/navigation/types';
import { useClientList } from '@/features/clients';
import { useAuth } from '@/providers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * TodaysJobsScreen
 *
 * Main entry screen showing today's scheduled jobs
 * TODO: Add quick actions, job detail navigation
 */
export function TodaysJobsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<'all' | 'my'>('all');
  const { data, isLoading } = useTodaysJobs();
  const { data: myJobsData } = useMyJobs();
  const { data: clientsData } = useClientList();
  const createMutation = useCreateJob();

  const clients = useMemo(() => clientsData?.items || [], [clientsData?.items]);

  const handleAdd = () => {
    setShowForm(true);
  };

  const handleSubmit = async (formData: JobFormData) => {
    await createMutation.mutateAsync(formData);
    setShowForm(false);
  };

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { jobId: job.id });
  };

  // Filter jobs based on filter toggle and search query
  const filteredJobs = useMemo(() => {
    const allJobs = data?.items || [];
    const myJobs = myJobsData?.items || [];

    // First apply the "All" vs "My Jobs" filter
    const jobsToShow = jobFilter === 'my' ? myJobs : allJobs;

    // Then apply search query
    if (!searchQuery.trim()) {
      return jobsToShow;
    }

    const query = searchQuery.toLowerCase();
    return jobsToShow.filter((job) => {
      const client = clients.find((c) => c.id === job.clientId);
      const clientName = client?.name.toLowerCase() || '';
      const jobType = job.type.toLowerCase();
      const description = job.description.toLowerCase();

      return clientName.includes(query) || jobType.includes(query) || description.includes(query);
    });
  }, [data?.items, myJobsData?.items, searchQuery, clients, jobFilter]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Spinner message="Loading today's jobs..." />
      </SafeAreaView>
    );
  }

  const jobs = filteredJobs;
  const allJobs = data?.items || [];
  const myJobs = myJobsData?.items || [];
  const hasAnyJobs = allJobs.length > 0;
  const myJobsCount = myJobs.filter((job) => job.assignment?.technicianId === user?.id).length;

  // Debug logging
  console.log('DEBUG TodaysJobsScreen:', {
    userId: user?.id,
    jobFilter,
    allJobsCount: allJobs.length,
    myJobsCount: myJobs.length,
    myJobsRawCount: myJobsData?.items?.length,
    filteredJobsCount: filteredJobs.length,
    sampleJob: myJobs[0]
      ? {
          id: myJobs[0].id,
          assignedTo: myJobs[0].assignment?.technicianId,
        }
      : 'no jobs',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {!hasAnyJobs ? (
          <EmptyState
            title="No jobs scheduled for today"
            description="Create a job to get started"
            action={<Button onPress={handleAdd}>Create Job</Button>}
          />
        ) : (
          <>
            {/* Professional Header */}
            <View style={styles.fixedHeader}>
              {/* Hero Section with Brand */}
              <HeroSection
                icon="calendar"
                title="Today's Schedule"
                count={allJobs.length}
                metadata={{
                  icon: 'time-outline',
                  text: new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  }),
                }}
                variant="dark"
              />

              {/* Search Row */}
              <View style={styles.searchRow}>
                <View style={styles.searchInputContainer}>
                  <Ionicons
                    name="search"
                    size={20}
                    color={colors.textMuted}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.inlineSearchInput}
                    placeholder="Search jobs..."
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
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.quickFindButton}
                  onPress={() => setShowSearchModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="filter" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Filter Chips */}
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[styles.filterChip, jobFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setJobFilter('all')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      jobFilter === 'all' && styles.filterChipTextActive,
                    ]}
                  >
                    All Jobs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, jobFilter === 'my' && styles.filterChipActive]}
                  onPress={() => setJobFilter('my')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      jobFilter === 'my' && styles.filterChipTextActive,
                    ]}
                  >
                    My Jobs
                  </Text>
                  {myJobsCount > 0 && (
                    <View style={styles.filterChipBadge}>
                      <Text style={styles.filterChipBadgeText}>{myJobsCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable Job List */}
            <FlatList
              data={jobs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <JobCard job={item} onPress={handleJobPress} />}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyResults}>
                  <Text style={styles.emptyResultsText}>No jobs match "{searchQuery}"</Text>
                  <Text style={styles.emptyResultsHint}>Try a different search term</Text>
                </View>
              }
            />
          </>
        )}
      </View>

      {/* Floating Create Button */}
      {hasAnyJobs && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={colors.surface} />
          <Text style={styles.floatingButtonText}>Create Job</Text>
        </TouchableOpacity>
      )}

      {/* Create Job Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <JobForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
        </SafeAreaView>
      </Modal>

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
            <Text style={styles.modalTitle}>Find Job</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          <View style={styles.modalSearchContainer}>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by client, job type, or description..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredJobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const client = clients.find((c) => c.id === item.clientId);
              return (
                <TouchableOpacity
                  style={styles.jobListItem}
                  onPress={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                    handleJobPress(item);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobListItemContent}>
                    <Text style={styles.jobListItemName}>
                      {item.type.toUpperCase()} - {client?.name || 'Unknown Client'}
                    </Text>
                    <Text style={styles.jobListItemDetails}>
                      {new Date(item.scheduledStart).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(item.scheduledEnd).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={styles.jobListItemAddress}>{item.description}</Text>
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
                  {searchQuery ? `No jobs match "${searchQuery}"` : 'Start typing to search'}
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
    backgroundColor: colors.primaryLight,
  },
  fixedHeader: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.primaryPressed,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryPressed,
    gap: spacing[3],
    marginTop: -100,
    paddingTop: 100 + spacing[3],
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
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  inlineSearchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    paddingLeft: spacing[12],
    paddingRight: spacing[12],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
    ...shadows.sm,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[20],
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing[4],
    left: '30%',
    right: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    minHeight: 56,
    ...shadows.lg,
  },
  floatingButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.surface,
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
  jobListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surface,
    minHeight: 80,
  },
  jobListItemContent: {
    flex: 1,
  },
  jobListItemName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  jobListItemDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  jobListItemAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    marginLeft: spacing[2],
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
  emptyResults: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emptyResultsHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Filter chips
  filterChips: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing[2],
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  filterChipBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  filterChipBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
