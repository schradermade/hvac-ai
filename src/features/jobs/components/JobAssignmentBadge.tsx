import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppointmentStatus } from '../types';
import { spacing, borderRadius, typography } from '@/components/ui';

interface JobAssignmentBadgeProps {
  status: AppointmentStatus;
}

/**
 * Status badge with colored dot indicator
 */
export function JobAssignmentBadge({ status }: JobAssignmentBadgeProps) {
  const statusConfig = getStatusConfig(status);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusConfig.color + '20', // 20% opacity
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: statusConfig.color,
          },
        ]}
      />
      <Text
        style={[
          styles.text,
          {
            color: statusConfig.color,
          },
        ]}
      >
        {statusConfig.label}
      </Text>
    </View>
  );
}

/**
 * Get color and label for each status
 */
function getStatusConfig(status: AppointmentStatus): { color: string; label: string } {
  switch (status) {
    case 'unassigned':
      return { color: '#9ca3af', label: 'Unassigned' };
    case 'assigned':
      return { color: '#2563eb', label: 'Pending' };
    case 'accepted':
      return { color: '#10b981', label: 'Accepted' };
    case 'declined':
      return { color: '#ef4444', label: 'Declined' };
    case 'scheduled':
      return { color: '#2563eb', label: 'Scheduled' };
    case 'in_progress':
      return { color: '#6366f1', label: 'In Progress' };
    case 'completed':
      return { color: '#10b981', label: 'Completed' };
    case 'cancelled':
      return { color: '#ef4444', label: 'Cancelled' };
    case 'rescheduled':
      return { color: '#f59e0b', label: 'Rescheduled' };
    default:
      return { color: '#9ca3af', label: status };
  }
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.base,
    gap: spacing[1],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
