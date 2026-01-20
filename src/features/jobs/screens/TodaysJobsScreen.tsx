import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { addDays, format, isBefore, isSameDay, parseISO } from 'date-fns';
import { EmptyState, Button, Spinner, HeroSection, FilterPills } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useJobList, useCreateJob } from '../hooks/useJobs';
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
  const [showDateControls, setShowDateControls] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleDateControls = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowDateControls((prev) => !prev);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<'all' | 'my'>('all');
  const rangeStart = useMemo(() => {
    const date = parseISO(startDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [startDate]);
  const rangeEnd = useMemo(() => {
    const date = parseISO(endDate);
    date.setHours(23, 59, 59, 999);
    return date;
  }, [endDate]);

  const { data, isLoading, isFetching } = useJobList({
    dateRange: { startDate: rangeStart, endDate: rangeEnd },
  });
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

  const jobs = filteredJobs;
  const allJobs = data?.items || [];
  const myJobs = (myJobsData?.items || []).filter((job) => {
    const scheduled = job.scheduledStart;
    return scheduled >= rangeStart && scheduled <= rangeEnd;
  });
  const hasAnyJobs = allJobs.length > 0;
  const myJobsCount = myJobs.filter((job) => job.assignment?.technicianId === user?.id).length;

  const dateLabel = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (!isSameDay(start, end)) {
      return `${format(start, 'MMM d')}–${format(end, 'MMM d')}`;
    }
    return format(start, 'MMM d');
  }, [startDate, endDate]);

  const isSingleDay = useMemo(
    () => isSameDay(parseISO(startDate), parseISO(endDate)),
    [startDate, endDate]
  );

  const markedDates = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const marked: Record<
      string,
      { color?: string; textColor?: string; startingDay?: boolean; endingDay?: boolean }
    > = {};

    if (isSingleDay) {
      const key = format(start, 'yyyy-MM-dd');
      marked[key] = {
        startingDay: true,
        endingDay: true,
        color: colors.primary,
        textColor: '#FFFFFF',
      };
      return marked;
    }

    let cursor = start;
    while (isBefore(cursor, end) || isSameDay(cursor, end)) {
      const key = format(cursor, 'yyyy-MM-dd');
      marked[key] = {
        startingDay: isSameDay(cursor, start),
        endingDay: isSameDay(cursor, end),
        color: colors.primary,
        textColor: '#FFFFFF',
      };
      cursor = addDays(cursor, 1);
    }

    return marked;
  }, [startDate, endDate, isSingleDay]);

  const handleDayPress = (dateString: string) => {
    const selected = parseISO(dateString);
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (isSameDay(start, end)) {
      if (isSameDay(selected, start)) {
        return;
      }
      if (isBefore(selected, start)) {
        setStartDate(dateString);
        setEndDate(format(start, 'yyyy-MM-dd'));
      } else {
        setEndDate(dateString);
      }
      return;
    }

    setStartDate(dateString);
    setEndDate(dateString);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
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
              <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
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

          <FilterPills
            items={[
              {
                id: 'all',
                label: 'All Jobs',
                active: jobFilter === 'all',
                onPress: () => setJobFilter('all'),
              },
              {
                id: 'my',
                label: 'My Jobs',
                active: jobFilter === 'my',
                onPress: () => setJobFilter('my'),
                count: myJobsCount,
              },
              {
                id: 'date',
                label: dateLabel,
                active: showDateControls,
                onPress: toggleDateControls,
              },
            ]}
            contentContainerStyle={styles.filterChips}
          />

          {showDateControls && (
            <View style={styles.dateControls}>
              <View style={styles.dateSummary}>
                <Text style={styles.dateSummaryLabel}>Selected</Text>
                <View style={styles.dateSummaryPill}>
                  <Text style={styles.dateSummaryText}>
                    {!isSameDay(parseISO(startDate), parseISO(endDate))
                      ? `${format(parseISO(startDate), 'MMM d, yyyy')} – ${format(
                          parseISO(endDate),
                          'MMM d, yyyy'
                        )}`
                      : format(parseISO(startDate), 'MMM d, yyyy')}
                  </Text>
                </View>
              </View>

                  <View style={styles.calendarCard}>
                    <Calendar
                      markingType="period"
                      markedDates={markedDates}
                      onDayPress={(day) => handleDayPress(day.dateString)}
                      theme={{
                        todayTextColor: colors.primary,
                        arrowColor: colors.primary,
                        textSectionTitleColor: colors.textSecondary,
                        textDayFontWeight: '500',
                    textMonthFontWeight: '600',
                    monthTextColor: colors.textPrimary,
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Scrollable Job List */}
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <JobCard job={item} onPress={handleJobPress} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            isLoading || isFetching ? (
              <View style={styles.listLoading}>
                <Spinner message="Loading jobs..." />
              </View>
            ) : !hasAnyJobs ? (
              <EmptyState
                title="No jobs scheduled for today"
                description="Create a job to get started"
                action={<Button onPress={handleAdd}>Create Job</Button>}
              />
            ) : (
              <View style={styles.emptyResults}>
                <Text style={styles.emptyResultsText}>No jobs match "{searchQuery}"</Text>
                <Text style={styles.emptyResultsHint}>Try a different search term</Text>
              </View>
            )
          }
        />
      </View>

      {/* Floating Action Button */}
      {hasAnyJobs && (
        <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#fff" />
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
    backgroundColor: colors.background,
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
    paddingTop: spacing[4],
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
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
    ...shadows.sm,
  },
  clearButton: {
    padding: spacing[1],
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
  fab: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
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
  dateSummary: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  dateSummaryLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  dateSummaryPill: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  dateSummaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  calendarCard: {
    marginTop: spacing[4],
    marginHorizontal: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    ...shadows.sm,
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
  listLoading: {
    paddingVertical: spacing[10],
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
  filterChips: {
    paddingTop: spacing[2],
  },
  dateControls: {
    marginTop: spacing[3],
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
  },
});
