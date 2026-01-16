import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button } from '@/components/ui';
import type { Job } from '../types';
import { useAcceptJob, useDeclineJob } from '../hooks/useJobAssignment';
import { spacing } from '@/components/ui';

interface JobActionButtonsProps {
  job: Job;
  currentUserId: string;
  onAssign?: () => void; // Callback to open assign modal
}

/**
 * Context-aware action buttons for job assignment
 * Shows different buttons based on job status and current user
 */
export function JobActionButtons({ job, currentUserId, onAssign }: JobActionButtonsProps) {
  const acceptJob = useAcceptJob();
  const declineJob = useDeclineJob();

  // Check if current user is the assigned technician
  const isAssignedToCurrentUser = job.assignment?.technicianId === currentUserId;

  const handleDecline = () => {
    Alert.alert(
      'Decline Job',
      'Why are you declining this job?',
      [
        {
          text: 'Schedule conflict',
          onPress: () => declineJob.mutate({ jobId: job.id, reason: 'Schedule conflict' }),
        },
        {
          text: 'Outside service area',
          onPress: () => declineJob.mutate({ jobId: job.id, reason: 'Outside service area' }),
        },
        {
          text: 'Lack of equipment',
          onPress: () => declineJob.mutate({ jobId: job.id, reason: 'Lack of equipment' }),
        },
        {
          text: 'Not qualified',
          onPress: () => declineJob.mutate({ jobId: job.id, reason: 'Not qualified' }),
        },
        {
          text: 'Other',
          onPress: () => declineJob.mutate({ jobId: job.id, reason: 'Other reason' }),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Show accept/decline buttons if job is assigned to current user and status is "assigned"
  if (isAssignedToCurrentUser && job.status === 'assigned') {
    return (
      <View style={styles.actions}>
        <Button
          variant="ghost"
          onPress={handleDecline}
          style={styles.declineButton}
          loading={declineJob.isPending}
        >
          Decline
        </Button>
        <Button
          variant="primary"
          onPress={() => acceptJob.mutate(job.id)}
          loading={acceptJob.isPending}
          style={styles.acceptButton}
        >
          Accept Job
        </Button>
      </View>
    );
  }

  // Show assign button if job is unassigned and onAssign callback provided (admin view)
  if (job.status === 'unassigned' && onAssign) {
    return (
      <Button variant="primary" onPress={onAssign}>
        Assign Technician
      </Button>
    );
  }

  // No actions available
  return null;
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  declineButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 2,
  },
});
