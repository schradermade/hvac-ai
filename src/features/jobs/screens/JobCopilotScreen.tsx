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
  background: '#9BA3F5', // Rich purple - matches main Copilot screen
  surface: '#FFFFFF', // Pure white - maximum contrast
  accent: '#6B73E8', // Saturated purple
  accentDark: '#4E56D9', // Rich deep purple
  border: '#7780DB', // Dark border
  text: '#1A2470', // Very dark purple
  textLight: '#3D4791', // Dark muted purple
  white: '#FFFFFF',
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
        <View style={styles.contextBanner}>
          <View style={styles.contextIcon}>
            <Ionicons name="briefcase" size={16} color={copilotPalette.white} />
          </View>
          <View style={styles.contextContent}>
            <View style={styles.contextRow}>
              <Text style={styles.contextTitle}>
                {job.type.toUpperCase()} •{' '}
                {clientLoading ? 'Loading...' : client?.name || 'Unknown Client'}
              </Text>
            </View>
            <Text style={styles.contextSubtitle}>
              {scheduleText} • #{shortJobId}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{getStatusLabel(job.status)}</Text>
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
              <Ionicons name="sparkles" size={14} color={copilotPalette.accent} />
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
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: copilotPalette.background,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: copilotPalette.accentDark,
    ...shadows.md,
  },
  contextIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  contextContent: {
    flex: 1,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  contextTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: copilotPalette.white,
  },
  contextSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: copilotPalette.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  followUpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: copilotPalette.background,
  },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: copilotPalette.surface,
    borderWidth: 1,
    borderColor: copilotPalette.border,
  },
  followUpText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: copilotPalette.text,
  },
});
