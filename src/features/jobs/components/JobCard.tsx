import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
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
 * Professional job card following FAANG-level design standards:
 * - 48x48pt icon container with briefcase icon
 * - Job type with status badge (colored dot)
 * - Time with clock icon
 * - Client name
 * - Description (truncated)
 * - Chevron indicator for tappability
 * - Optional quick diagnostic action
 */
export function JobCard({ job, onPress, onStartDiagnostic }: JobCardProps) {
  const { data: client } = useClient(job.clientId);

  // Format time
  const timeStr = job.scheduledStart.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in_progress':
        return colors.primary;
      case 'scheduled':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const statusColor = getStatusColor(job.status);

  // Get icon based on job type
  const getJobIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type.toLowerCase()) {
      case 'maintenance':
        return 'construct';
      case 'repair':
        return 'build';
      case 'installation':
        return 'settings';
      case 'inspection':
        return 'search';
      case 'emergency':
        return 'alert-circle';
      default:
        return 'briefcase';
    }
  };

  return (
    <Card onPress={onPress ? () => onPress(job) : undefined} style={styles.card}>
      <View style={styles.container}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <Ionicons name={getJobIcon(job.type)} size={24} color={colors.primary} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header: Job type and status */}
          <View style={styles.header}>
            <Text style={styles.jobType}>{job.type.toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {job.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Time with icon */}
          <View style={styles.detailRow}>
            <Ionicons
              name="time"
              size={14}
              color={colors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>{timeStr}</Text>
          </View>

          {/* Client with icon */}
          <View style={styles.detailRow}>
            <Ionicons
              name="person"
              size={14}
              color={colors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {client?.name || 'Loading...'}
            </Text>
          </View>

          {/* Description */}
          {job.description && (
            <Text style={styles.description} numberOfLines={2}>
              {job.description}
            </Text>
          )}

          {/* Optional quick action */}
          {onStartDiagnostic && (
            <TouchableOpacity
              style={styles.quickAction}
              onPress={(e) => {
                e.stopPropagation();
                onStartDiagnostic(job);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={18} color={colors.surface} />
              <Text style={styles.quickActionText}>Start Diagnostic</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chevron */}
        {onPress && (
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
    padding: spacing[4],
    ...shadows.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.base,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing[1],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  jobType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.base,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  detailIcon: {
    width: 14,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: spacing[1],
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.base,
    ...shadows.sm,
  },
  quickActionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.surface,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
