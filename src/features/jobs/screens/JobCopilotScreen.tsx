import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers';
import { Card, Spinner } from '@/components/ui';
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

export function JobCopilotScreen({ route }: Props) {
  const { jobId } = route.params;
  const { user } = useAuth();
  const listRef = useRef<JobCopilotMessageListHandle>(null);
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

  const bottomInset = Math.max(0, keyboardHeight - insets.bottom);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.contextHeader}>
        <Card style={styles.contextCard}>
          <View style={styles.contextRow}>
            <View style={styles.contextIcon}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.contextInfo}>
              <Text style={styles.contextTitle}>{job.type.toUpperCase()}</Text>
              <Text style={styles.contextSubtitle}>
                {clientLoading ? 'Loading client...' : client?.name || 'Unknown Client'}
              </Text>
            </View>
          </View>
          <View style={styles.contextMeta}>
            <Text style={styles.contextMetaText}>Job ID</Text>
            <Text style={styles.contextMetaValue}>{job.id}</Text>
          </View>
        </Card>
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
    backgroundColor: '#F4F6FE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6FE',
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
  },
  contextHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    backgroundColor: '#F4F6FE',
  },
  contextCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  contextIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  contextInfo: {
    flex: 1,
  },
  contextTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  contextSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contextMeta: {
    marginTop: spacing[3],
  },
  contextMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contextMetaValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  followUpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: '#F4F6FE',
  },
  followUpChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followUpText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
});
