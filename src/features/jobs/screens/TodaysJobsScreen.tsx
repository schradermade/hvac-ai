import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Modal, TextInput, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, Button, Spinner } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useTodaysJobs, useCreateJob } from '../hooks/useJobs';
import { JobCard } from '../components/JobCard';
import { JobForm } from '../components/JobForm';
import type { JobFormData, Job } from '../types';
import type { RootStackParamList } from '@/navigation/types';
import { useClientList } from '@/features/clients';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * TodaysJobsScreen
 *
 * Main entry screen showing today's scheduled jobs
 * TODO: Add quick actions, job detail navigation
 */
export function TodaysJobsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showForm, setShowForm] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useTodaysJobs();
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

  const handleStartDiagnostic = (job: Job) => {
    navigation.navigate('DiagnosticChat', {
      clientId: job.clientId,
      jobId: job.id,
      equipmentId: job.equipmentId,
    });
  };

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    const allJobs = data?.items || [];

    if (!searchQuery.trim()) {
      return allJobs;
    }

    const query = searchQuery.toLowerCase();
    return allJobs.filter((job) => {
      const client = clients.find((c) => c.id === job.clientId);
      const clientName = client?.name.toLowerCase() || '';
      const jobType = job.type.toLowerCase();
      const description = job.description.toLowerCase();

      return clientName.includes(query) || jobType.includes(query) || description.includes(query);
    });
  }, [data?.items, searchQuery, clients]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Spinner message="Loading today's jobs..." />
      </SafeAreaView>
    );
  }

  const jobs = filteredJobs;
  const allJobs = data?.items || [];
  const hasAnyJobs = allJobs.length > 0;

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
              <View style={styles.heroSection}>
                <View style={styles.heroContent}>
                  <View style={styles.titleRow}>
                    <Ionicons name="calendar" size={28} color={colors.primary} />
                    <Text style={styles.heroTitle}>Today's Schedule</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{allJobs.length}</Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.dateText}>
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                {/* Brand Header - Top Right */}
                <View style={styles.brandHeader}>
                  <View style={styles.brandLogoContainer}>
                    <Ionicons name="snow" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.brandText}>HVAC AI</Text>
                </View>
              </View>

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

              {/* Action Button */}
              <Button onPress={handleAdd}>Create Job</Button>
            </View>

            {/* Scrollable Job List */}
            <FlatList
              data={jobs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <JobCard
                  job={item}
                  onPress={handleJobPress}
                  onStartDiagnostic={handleStartDiagnostic}
                />
              )}
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
                    handleStartDiagnostic(item);
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
  },
  fixedHeader: {
    paddingTop: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  countBadge: {
    backgroundColor: colors.primary + '20',
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
    color: colors.primary,
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
});
