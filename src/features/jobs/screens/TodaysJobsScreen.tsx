import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
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
import { addDays, endOfWeek, format, isBefore, isSameDay, parseISO, startOfWeek } from 'date-fns';
import {
  EmptyState,
  Button,
  Spinner,
  SectionHeader,
  SearchInput,
  ListCountBadge,
} from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useJobList, useCreateJob } from '../hooks/useJobs';
import { useMyJobs } from '../hooks/useJobAssignment';
import { JobCard } from '../components/JobCard';
import { JobForm } from '../components/JobForm';
import type { JobFormData, Job } from '../types';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/providers';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ListRow =
  | { key: string; type: 'header'; title: string }
  | { key: string; type: 'empty' }
  | { key: string; type: 'job'; job: Job };

const JOB_ROW_HEIGHT = 164;
const DATE_HEADER_HEIGHT = 32;
const EMPTY_ROW_HEIGHT = 72;

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
  const [showDateControls, setShowDateControls] = useState(false);
  const [isDateSelected, setIsDateSelected] = useState(true);
  const [hasDraftSelection, setHasDraftSelection] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const [appliedStartDate, setAppliedStartDate] = useState<string>(() => todayKey);
  const [appliedEndDate, setAppliedEndDate] = useState<string>(() => todayKey);
  const [draftStartDate, setDraftStartDate] = useState<string>(() => todayKey);
  const [draftEndDate, setDraftEndDate] = useState<string>(() => todayKey);
  const weekStartKey = format(startOfWeek(new Date()), 'yyyy-MM-dd');
  const weekEndKey = format(endOfWeek(new Date()), 'yyyy-MM-dd');

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleDateControls = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowDateControls((prev) => {
      const next = !prev;
      if (next) {
        if (isDateSelected) {
          setDraftStartDate(appliedStartDate);
          setDraftEndDate(appliedEndDate);
          setHasDraftSelection(true);
        } else {
          setDraftStartDate(todayKey);
          setDraftEndDate(todayKey);
          setHasDraftSelection(false);
        }
      }
      return next;
    });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<'all' | 'my'>('all');
  const rangeStart = useMemo(() => {
    const date = parseISO(appliedStartDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [appliedStartDate]);
  const rangeEnd = useMemo(() => {
    const date = parseISO(appliedEndDate);
    date.setHours(23, 59, 59, 999);
    return date;
  }, [appliedEndDate]);

  const isDateFiltering = isDateSelected;
  const debouncedSearch = useDebouncedValue(searchQuery, 250);
  const allJobsFilters = useMemo(
    () => ({ search: debouncedSearch || undefined }),
    [debouncedSearch]
  );
  const { data: allJobsData, isLoading, isFetching } = useJobList(allJobsFilters);
  const { data: myJobsData } = useMyJobs(debouncedSearch || undefined);
  const createMutation = useCreateJob();

  const handleAdd = () => {
    setShowForm(true);
  };

  const clearDateFilter = () => {
    setAppliedStartDate(todayKey);
    setAppliedEndDate(todayKey);
    setDraftStartDate(todayKey);
    setDraftEndDate(todayKey);
    setIsDateSelected(false);
    setHasDraftSelection(false);
    setShowDateControls(false);
  };

  const applyTodayFilter = () => {
    setAppliedStartDate(todayKey);
    setAppliedEndDate(todayKey);
    setDraftStartDate(todayKey);
    setDraftEndDate(todayKey);
    setIsDateSelected(true);
    setHasDraftSelection(true);
    setShowDateControls(false);
  };

  const applyThisWeekFilter = () => {
    setAppliedStartDate(weekStartKey);
    setAppliedEndDate(weekEndKey);
    setDraftStartDate(weekStartKey);
    setDraftEndDate(weekEndKey);
    setIsDateSelected(true);
    setHasDraftSelection(true);
    setShowDateControls(false);
  };

  const clearDateConstraint = () => {
    setIsDateSelected(false);
    setHasDraftSelection(false);
    setShowDateControls(false);
  };

  const handleSubmit = async (formData: JobFormData) => {
    await createMutation.mutateAsync(formData);
    setShowForm(false);
  };

  const handleJobPress = useCallback(
    (job: Job) => {
      navigation.navigate('JobDetail', { jobId: job.id });
    },
    [navigation]
  );

  const allJobsDataItems = useMemo(() => allJobsData?.items || [], [allJobsData?.items]);
  const allJobs = useMemo(() => {
    const items = allJobsDataItems;
    if (!isDateFiltering) {
      return items;
    }
    return items.filter((job) => {
      const scheduled = job.scheduledStart;
      return scheduled >= rangeStart && scheduled <= rangeEnd;
    });
  }, [allJobsDataItems, isDateFiltering, rangeStart, rangeEnd]);
  const myJobs = useMemo(() => {
    const items = myJobsData?.items || [];
    if (!isDateFiltering) {
      return items;
    }
    return items.filter((job) => {
      const scheduled = job.scheduledStart;
      return scheduled >= rangeStart && scheduled <= rangeEnd;
    });
  }, [myJobsData?.items, isDateFiltering, rangeStart, rangeEnd]);

  // Filter jobs based on filter toggle
  const filteredJobs = useMemo(() => {
    // First apply the "All" vs "My Jobs" filter
    const jobsToShow = jobFilter === 'my' ? myJobs : allJobs;
    return jobsToShow;
  }, [allJobs, myJobs, jobFilter]);

  const jobs = filteredJobs;
  const hasAnyJobs = allJobs.length > 0;
  const myJobsCount = myJobs.filter((job) => job.assignment?.technicianId === user?.id).length;
  const jobsForDateCounts = useMemo(
    () => (jobFilter === 'my' ? myJobs : allJobsDataItems),
    [jobFilter, myJobs, allJobsDataItems]
  );
  const todayCount = useMemo(() => {
    const start = parseISO(todayKey);
    start.setHours(0, 0, 0, 0);
    const end = parseISO(todayKey);
    end.setHours(23, 59, 59, 999);
    return jobsForDateCounts.filter(
      (job) => job.scheduledStart >= start && job.scheduledStart <= end
    ).length;
  }, [jobsForDateCounts, todayKey]);
  const weekCount = useMemo(() => {
    const start = parseISO(weekStartKey);
    start.setHours(0, 0, 0, 0);
    const end = parseISO(weekEndKey);
    end.setHours(23, 59, 59, 999);
    return jobsForDateCounts.filter(
      (job) => job.scheduledStart >= start && job.scheduledStart <= end
    ).length;
  }, [jobsForDateCounts, weekEndKey, weekStartKey]);

  const showDateClear = isDateSelected;
  const isTodayApplied =
    isDateSelected && appliedStartDate === todayKey && appliedEndDate === todayKey;
  const isThisWeekApplied =
    isDateSelected && appliedStartDate === weekStartKey && appliedEndDate === weekEndKey;
  const isCustomDateActive = isDateSelected && !isTodayApplied && !isThisWeekApplied;

  const dateLabel = useMemo(() => {
    if (!isDateSelected) {
      return 'Select dates';
    }
    const start = parseISO(appliedStartDate);
    const end = parseISO(appliedEndDate);
    if (!isSameDay(start, end)) {
      const sameYear = start.getFullYear() === end.getFullYear();
      const startFormat = sameYear ? 'MMM d' : 'MMM d, yyyy';
      return `${format(start, startFormat)} - ${format(end, 'MMM d, yyyy')}`;
    }
    return format(start, 'MMM d, yyyy');
  }, [appliedStartDate, appliedEndDate, isDateSelected]);
  const hasDateChanges = draftStartDate !== appliedStartDate || draftEndDate !== appliedEndDate;
  const canApplyDates = hasDraftSelection && hasDateChanges;

  const isSingleDay = useMemo(() => {
    if (!hasDraftSelection) {
      return false;
    }
    return isSameDay(parseISO(draftStartDate), parseISO(draftEndDate));
  }, [draftStartDate, draftEndDate, hasDraftSelection]);

  const markedDates = useMemo(() => {
    if (!hasDraftSelection) {
      return {};
    }
    const start = parseISO(draftStartDate);
    const end = parseISO(draftEndDate);
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
  }, [draftStartDate, draftEndDate, isSingleDay, hasDraftSelection]);

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) =>
      sortOrder === 'desc'
        ? b.scheduledStart.getTime() - a.scheduledStart.getTime()
        : a.scheduledStart.getTime() - b.scheduledStart.getTime()
    );
  }, [jobs, sortOrder]);

  const jobsByDateMap = useMemo(() => {
    const map = new Map<string, Job[]>();
    sortedJobs.forEach((job) => {
      const dateKey = format(job.scheduledStart, 'yyyy-MM-dd');
      const bucket = map.get(dateKey);
      if (bucket) {
        bucket.push(job);
      } else {
        map.set(dateKey, [job]);
      }
    });
    return map;
  }, [sortedJobs]);

  const jobsByDateSections = useMemo(() => {
    if (isDateFiltering) {
      const sections: Array<{ title: string; dateKey: string; data: Job[] }> = [];
      const step = sortOrder === 'desc' ? -1 : 1;
      let cursor =
        sortOrder === 'desc' ? new Date(rangeEnd.getTime()) : new Date(rangeStart.getTime());

      while (sortOrder === 'desc' ? cursor >= rangeStart : cursor <= rangeEnd) {
        const dateKey = format(cursor, 'yyyy-MM-dd');
        const title = format(cursor, 'EEEE, MMMM d');
        sections.push({
          title,
          dateKey,
          data: jobsByDateMap.get(dateKey) || [],
        });
        cursor = addDays(cursor, step);
      }
      return sections;
    }

    const sections: Array<{ title: string; dateKey: string; data: Job[] }> = [];
    sortedJobs.forEach((job) => {
      const dateKey = format(job.scheduledStart, 'yyyy-MM-dd');
      const title = format(job.scheduledStart, 'EEEE, MMMM d');
      const last = sections[sections.length - 1];
      if (last && last.dateKey === dateKey) {
        last.data.push(job);
      } else {
        sections.push({ title, dateKey, data: [job] });
      }
    });
    return sections;
  }, [isDateFiltering, jobsByDateMap, rangeEnd, rangeStart, sortOrder, sortedJobs]);

  const listRows = useMemo<ListRow[]>(() => {
    const rows: ListRow[] = [];
    jobsByDateSections.forEach((section) => {
      rows.push({
        key: `header-${section.dateKey}`,
        type: 'header',
        title: section.title,
      });
      if (section.data.length === 0) {
        rows.push({ key: `empty-${section.dateKey}`, type: 'empty' });
        return;
      }
      section.data.forEach((job) => {
        rows.push({ key: job.id, type: 'job', job });
      });
    });
    return rows;
  }, [jobsByDateSections]);

  const listRowMetrics = useMemo(() => {
    const offsets: number[] = [];
    const lengths: number[] = [];
    let offset = 0;
    listRows.forEach((row, index) => {
      const length =
        row.type === 'job'
          ? JOB_ROW_HEIGHT
          : row.type === 'header'
            ? DATE_HEADER_HEIGHT
            : EMPTY_ROW_HEIGHT;
      offsets[index] = offset;
      lengths[index] = length;
      offset += length;
    });
    return { offsets, lengths };
  }, [listRows]);

  const renderListRow = useCallback(
    ({ item }: { item: ListRow }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.dateHeaderRow}>
            <Text style={styles.dateHeaderText}>{item.title}</Text>
          </View>
        );
      }
      if (item.type === 'empty') {
        return (
          <View style={styles.emptyDayRow}>
            <Text style={styles.emptyDayText}>No jobs</Text>
          </View>
        );
      }
      return <JobCard job={item.job} onPress={handleJobPress} />;
    },
    [handleJobPress]
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<ListRow> | null | undefined, index: number) => {
      const length = listRowMetrics.lengths[index] ?? EMPTY_ROW_HEIGHT;
      const offset = listRowMetrics.offsets[index] ?? 0;
      return { length, offset, index };
    },
    [listRowMetrics]
  );

  const calendarTheme = useMemo(
    () => ({
      todayTextColor: colors.primary,
      arrowColor: colors.primary,
      textSectionTitleColor: colors.textSecondary,
      textDayFontWeight: '500',
      textMonthFontWeight: '600',
      monthTextColor: colors.textPrimary,
      'stylesheet.day.period': {
        today: {
          borderWidth: 1,
          borderColor: colors.primary,
          borderRadius: 17,
        },
      },
    }),
    []
  );

  const handleDayPress = (dateString: string) => {
    if (!hasDraftSelection) {
      setHasDraftSelection(true);
      setDraftStartDate(dateString);
      setDraftEndDate(dateString);
      return;
    }
    const selected = parseISO(dateString);
    const start = parseISO(draftStartDate);
    const end = parseISO(draftEndDate);

    if (isSameDay(start, end)) {
      if (isSameDay(selected, start)) {
        return;
      }
      if (isBefore(selected, start)) {
        setDraftStartDate(dateString);
        setDraftEndDate(format(start, 'yyyy-MM-dd'));
      } else {
        setDraftEndDate(dateString);
      }
      return;
    }

    setDraftStartDate(dateString);
    setDraftEndDate(dateString);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {/* Professional Header */}
        <SectionHeader
          icon="calendar"
          title="Jobs"
          metadata={{
            icon: 'time-outline',
            text: new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }),
          }}
          variant="dark"
          count={jobs.length}
          showCount={false}
        >
          {/* Search Row */}
          <View style={styles.searchRow}>
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search jobs..."
            />
            <View style={styles.sortInlineContainer}>
              <TouchableOpacity
                onPress={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                activeOpacity={0.7}
                style={styles.sortIconButton}
                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
              >
                <View style={styles.sortIconStack}>
                  <Ionicons
                    name="arrow-up"
                    size={sortOrder === 'asc' ? 26 : 20}
                    color={sortOrder === 'asc' ? colors.surface : 'rgba(255, 255, 255, 0.45)'}
                  />
                  <Ionicons
                    name="arrow-down"
                    size={sortOrder === 'desc' ? 26 : 20}
                    color={sortOrder === 'desc' ? colors.surface : 'rgba(255, 255, 255, 0.45)'}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.filterBarRow}>
            <View style={styles.scopeRow}>
              <TouchableOpacity
                onPress={() => {
                  setJobFilter('all');
                  setShowDateControls(false);
                }}
                activeOpacity={0.7}
                style={[
                  styles.scopeSegment,
                  styles.scopeSegmentLeft,
                  jobFilter === 'all' && styles.scopeSegmentActive,
                ]}
              >
                <Text
                  style={[
                    styles.scopeSegmentText,
                    jobFilter === 'all' && styles.scopeSegmentTextActive,
                  ]}
                >
                  All Jobs
                </Text>
                <View
                  style={[
                    styles.scopeCountBadge,
                    jobFilter === 'all' && styles.scopeCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.scopeCountText,
                      jobFilter === 'all' && styles.scopeCountTextActive,
                    ]}
                  >
                    {allJobs.length}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setJobFilter('my');
                  setShowDateControls(false);
                }}
                activeOpacity={0.7}
                style={[
                  styles.scopeSegment,
                  styles.scopeSegmentRight,
                  jobFilter === 'my' && styles.scopeSegmentActive,
                ]}
              >
                <Text
                  style={[
                    styles.scopeSegmentText,
                    jobFilter === 'my' && styles.scopeSegmentTextActive,
                  ]}
                >
                  My Jobs
                </Text>
                <View
                  style={[
                    styles.scopeCountBadge,
                    jobFilter === 'my' && styles.scopeCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.scopeCountText,
                      jobFilter === 'my' && styles.scopeCountTextActive,
                    ]}
                  >
                    {myJobsCount}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.dateToggleRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (isTodayApplied) {
                      clearDateConstraint();
                      return;
                    }
                    applyTodayFilter();
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.dateSegment,
                    styles.dateSegmentLeft,
                    isTodayApplied && styles.dateSegmentActive,
                  ]}
                >
                  {!isTodayApplied && !isThisWeekApplied && <View style={styles.dateDivider} />}
                  <Text
                    style={[styles.dateSegmentText, isTodayApplied && styles.dateSegmentTextActive]}
                  >
                    Today
                  </Text>
                  <View
                    style={[styles.dateCountBadge, isTodayApplied && styles.dateCountBadgeActive]}
                  >
                    <Text
                      style={[styles.dateCountText, isTodayApplied && styles.dateCountTextActive]}
                    >
                      {todayCount}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (isThisWeekApplied) {
                      clearDateConstraint();
                      return;
                    }
                    applyThisWeekFilter();
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.dateSegment,
                    styles.dateSegmentMiddle,
                    isThisWeekApplied && styles.dateSegmentActive,
                  ]}
                >
                  {!isThisWeekApplied && !isCustomDateActive && <View style={styles.dateDivider} />}
                  <Text
                    style={[
                      styles.dateSegmentText,
                      isThisWeekApplied && styles.dateSegmentTextActive,
                    ]}
                  >
                    This Week
                  </Text>
                  <View
                    style={[
                      styles.dateCountBadge,
                      isThisWeekApplied && styles.dateCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateCountText,
                        isThisWeekApplied && styles.dateCountTextActive,
                      ]}
                    >
                      {weekCount}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    toggleDateControls();
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.dateSegment,
                    styles.dateSegmentRight,
                    isCustomDateActive && styles.dateSegmentActive,
                    !isCustomDateActive && styles.dateSegmentInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateSegmentText,
                      isCustomDateActive && styles.dateSegmentTextActive,
                      !isCustomDateActive && styles.dateSegmentTextInactive,
                    ]}
                  >
                    {dateLabel}
                  </Text>
                  {showDateClear ? (
                    <TouchableOpacity
                      onPress={clearDateFilter}
                      style={[
                        styles.dateClearButton,
                        !isCustomDateActive && styles.dateClearButtonInactive,
                      ]}
                      hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={isCustomDateActive ? colors.surface : colors.textSecondary}
                        style={styles.dateClearIcon}
                      />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons
                      name={showDateControls ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isCustomDateActive ? colors.surface : colors.textSecondary}
                      style={styles.dateChevronIcon}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {showDateControls && (
            <View style={styles.calendarBlock}>
              <View style={styles.calendarHeaderRow}>
                <TouchableOpacity
                  style={[
                    styles.calendarApplyButton,
                    !canApplyDates && styles.calendarApplyButtonDisabled,
                  ]}
                  onPress={() => {
                    if (!canApplyDates) {
                      return;
                    }
                    setAppliedStartDate(draftStartDate);
                    setAppliedEndDate(draftEndDate);
                    setIsDateSelected(true);
                    setShowDateControls(false);
                  }}
                  activeOpacity={0.7}
                  disabled={!canApplyDates}
                >
                  <Text
                    style={[
                      styles.calendarApplyText,
                      !canApplyDates && styles.calendarApplyTextDisabled,
                    ]}
                  >
                    Apply
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calendarCloseButton}
                  onPress={() => setShowDateControls(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.calendarCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.calendarCard}>
                <Calendar
                  markingType="period"
                  enableSwipeMonths
                  markedDates={markedDates}
                  onDayPress={(day) => handleDayPress(day.dateString)}
                  style={styles.calendar}
                  renderArrow={(direction) => (
                    <View style={styles.calendarArrow}>
                      <Ionicons
                        name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                        size={28}
                        color={colors.primary}
                      />
                    </View>
                  )}
                  theme={calendarTheme}
                />
              </View>
            </View>
          )}
        </SectionHeader>

        {/* Scrollable Job List */}
        <View style={styles.listContainer}>
          <ListCountBadge count={jobs.length} style={styles.listCountBadge} />
          <FlatList
            data={listRows}
            keyExtractor={(item) => item.key}
            renderItem={renderListRow}
            contentContainerStyle={styles.list}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews
            getItemLayout={getItemLayout}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: 0,
    flexShrink: 0,
  },
  scopeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: 'transparent',
    height: 44,
    minHeight: 44,
  },
  scopeSegmentLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  scopeSegmentRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 2,
    borderLeftColor: colors.surface,
  },
  scopeSegmentActive: {
    backgroundColor: colors.primaryHover,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  scopeSegmentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  scopeSegmentTextActive: {
    color: colors.surface,
  },
  scopeCountBadge: {
    minWidth: 24,
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryPressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeCountBadgeActive: {
    backgroundColor: colors.surface,
  },
  scopeCountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.surface,
  },
  scopeCountTextActive: {
    color: colors.primary,
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[20],
  },
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  listCountBadge: {
    position: 'absolute',
    right: spacing[4],
    top: spacing[2],
    zIndex: 2,
  },
  dateHeaderRow: {
    height: DATE_HEADER_HEIGHT,
    justifyContent: 'center',
  },
  dateHeaderText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  emptyDayRow: {
    height: EMPTY_ROW_HEIGHT,
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  emptyDayText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
  calendarBlock: {
    marginTop: spacing[3],
  },
  calendarCard: {
    marginTop: 0,
    marginHorizontal: 0,
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  calendar: {
    paddingBottom: spacing[3],
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing[2],
  },
  calendarCloseButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    transform: [{ translateY: -4 }],
  },
  calendarCloseText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  calendarApplyButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    marginRight: spacing[2],
    transform: [{ translateY: -4 }],
  },
  calendarApplyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.surface,
  },
  calendarApplyButtonDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.6,
  },
  calendarApplyTextDisabled: {
    color: colors.textTertiary,
  },
  dateClearButton: {
    marginLeft: spacing[1],
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  dateClearButtonInactive: {
    borderColor: colors.textSecondary,
  },
  dateClearIcon: {
    marginTop: 1,
  },
  dateChevronIcon: {
    marginLeft: spacing[1],
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
  calendarArrow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -2 }],
  },
  filterRow: {
    position: 'relative',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  dateToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },
  dateSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: 'transparent',
    height: 44,
    minHeight: 44,
  },
  dateSegmentLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  dateSegmentMiddle: {
    borderRadius: 0,
  },
  dateSegmentRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  dateDivider: {
    position: 'absolute',
    right: -1,
    top: 6,
    bottom: 6,
    width: 1,
    backgroundColor: colors.surface,
  },
  dateSegmentActive: {
    backgroundColor: colors.primaryHover,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  dateSegmentInactive: {
    backgroundColor: colors.primaryLight,
  },
  dateSegmentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  dateSegmentTextActive: {
    color: colors.surface,
  },
  dateSegmentTextInactive: {
    color: colors.textSecondary,
  },
  dateCountBadge: {
    minWidth: 24,
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryPressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCountBadgeActive: {
    backgroundColor: colors.surface,
  },
  dateCountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.surface,
  },
  dateCountTextActive: {
    color: colors.primary,
  },
  sortInlineContainer: {
    paddingHorizontal: spacing[2],
    borderRadius: 0,
    backgroundColor: colors.primaryPressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIconButton: {
    width: 36,
    height: 36,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryPressed,
  },
  sortIconStack: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
