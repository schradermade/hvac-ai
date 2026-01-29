import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers';
import { Spinner } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useJob } from '../hooks/useJobs';
import { useClient } from '@/features/clients';
import { useJobCopilot } from '../hooks/useJobCopilot';
import {
  JobCopilotMessageList,
  type JobCopilotMessageListHandle,
} from '../components/JobCopilotMessageList';
import { ChatInput } from '@/features/diagnostic/components/ChatInput';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'JobCopilot'>;

const copilotPalette = {
  background: '#D4D7FB',
  surface: '#EEF0FF',
  accent: '#9B9EF6',
  border: '#B8BDF4',
  accentText: '#2F3180',
  tabText: '#FFFFFF',
} as const;

export function JobCopilotScreen({ route }: Props) {
  const { jobId, initialPrompt } = route.params;
  const { user } = useAuth();
  const listRef = useRef<JobCopilotMessageListHandle>(null);
  const seededPromptRef = useRef(false);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { data: job, isLoading: jobLoading } = useJob(jobId);
  const { data: client, isLoading: clientLoading } = useClient(job?.clientId || '');
  const { messages, isSending, sendMessage, followUps } = useJobCopilot(
    jobId,
    user?.id || 'user',
    user ? `${user.firstName} ${user.lastName}` : undefined
  );

  useEffect(() => {
    if (!initialPrompt || seededPromptRef.current) {
      return;
    }
    seededPromptRef.current = true;
    sendMessage(initialPrompt);
  }, [initialPrompt, sendMessage]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      requestAnimationFrame(() => listRef.current?.scrollToLatest());
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (jobLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <Spinner message="Loading job context..." />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <Text style={styles.errorText}>Job not found.</Text>
      </SafeAreaView>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      unassigned: 'Unassigned',
      assigned: 'Assigned',
      accepted: 'Accepted',
      declined: 'Declined',
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rescheduled: 'Rescheduled',
    };
    return map[status] ?? status.replace(/_/g, ' ');
  };

  const scheduleText = `${formatDate(job.scheduledStart)} • ${formatTime(
    job.scheduledStart
  )}–${formatTime(job.scheduledEnd)}`;
  const shortJobId = job.id.length > 8 ? job.id.slice(0, 8).toUpperCase() : job.id;

  const bottomInset = Math.max(0, keyboardHeight - insets.bottom);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.contextHeader}>
        <View style={styles.contextPill}>
          <View style={styles.contextRow}>
            <View style={styles.contextIcon}>
              <Ionicons name="briefcase-outline" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.contextTitle}>{job.type.toUpperCase()}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{getStatusLabel(job.status)}</Text>
            </View>
          </View>
          <View style={styles.contextMetaRow}>
            <Text style={styles.contextSubtitle}>
              {clientLoading ? 'Loading client...' : client?.name || 'Unknown Client'}
            </Text>
            <Text style={styles.contextDot}>•</Text>
            <Text style={styles.contextMetaValue}>{scheduleText}</Text>
            <Text style={styles.contextDot}>•</Text>
            <Text style={styles.contextMetaValue}>#{shortJobId}</Text>
          </View>
        </View>
      </View>

      <JobCopilotMessageList
        ref={listRef}
        messages={messages}
        currentUserId={user?.id || 'user'}
        scrollKey={jobId}
        bottomInset={bottomInset}
      />

      {followUps.length > 0 && (
        <View style={styles.followUpRow}>
          {followUps.map((followUp) => (
            <TouchableOpacity
              key={followUp}
              style={styles.followUpChip}
              onPress={() => sendMessage(followUp)}
              activeOpacity={0.8}
            >
              <Text style={styles.followUpText}>{followUp}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ChatInput
        onSend={sendMessage}
        onFocus={() => listRef.current?.scrollToLatest()}
        disabled={isSending}
        placeholder="Ask about this job, notes, or service history..."
        containerStyle={{ paddingBottom: spacing[4] + bottomInset }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: copilotPalette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: copilotPalette.background,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
  },
  contextHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    backgroundColor: copilotPalette.background,
  },
  contextPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: copilotPalette.surface,
    borderWidth: 1,
    borderColor: copilotPalette.border,
    ...shadows.sm,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  contextIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: copilotPalette.accent,
  },
  contextTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: copilotPalette.accentText,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: copilotPalette.accent,
    borderWidth: 1,
    borderColor: copilotPalette.accent,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: copilotPalette.tabText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contextSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  contextMetaRow: {
    marginTop: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  contextDot: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
  },
  contextMetaValue: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  followUpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: copilotPalette.background,
  },
  followUpChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: copilotPalette.accent,
    borderWidth: 1,
    borderColor: copilotPalette.accent,
  },
  followUpText: {
    fontSize: typography.fontSize.sm,
    color: copilotPalette.tabText,
  },
});
