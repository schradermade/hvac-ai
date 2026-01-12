import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, typography } from '@/components/ui';
import { useClient } from '@/features/clients';
import type { Job } from '../types';

/**
 * Props for JobCard component
 */
interface JobCardProps {
  job: Job;
  // eslint-disable-next-line no-unused-vars
  onPress?: (job: Job) => void;
  // eslint-disable-next-line no-unused-vars
  onStartDiagnostic?: (job: Job) => void;
}

/**
 * JobCard Component
 *
 * Displays job summary in a card with:
 * - Job type badge
 * - Status badge
 * - Client name
 * - Scheduled time
 * - Description
 * - Start Diagnostic button
 */
export function JobCard({ job, onPress, onStartDiagnostic }: JobCardProps) {
  const { data: client } = useClient(job.clientId);

  // Format time
  const timeStr = job.scheduledStart.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Status badge variant
  const statusVariant =
    job.status === 'completed'
      ? 'success'
      : job.status === 'in_progress'
        ? 'info'
        : job.status === 'cancelled'
          ? 'error'
          : 'neutral';

  return (
    <Card onPress={onPress ? () => onPress(job) : undefined} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badges}>
          <Badge variant="info">{job.type.toUpperCase()}</Badge>
          <Badge variant={statusVariant}>{job.status.replace('_', ' ').toUpperCase()}</Badge>
        </View>
        <Text style={styles.time}>{timeStr}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.client}>{client?.name || 'Loading...'}</Text>
        <Text style={styles.description}>{job.description}</Text>
      </View>

      {onStartDiagnostic && (
        <TouchableOpacity
          style={styles.diagnosticButton}
          onPress={(e) => {
            e.stopPropagation();
            onStartDiagnostic(job);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.diagnosticButtonText}>🔧 Start Diagnostic</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  badges: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  time: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  details: {
    gap: spacing[2],
  },
  client: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  diagnosticButton: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  diagnosticButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
