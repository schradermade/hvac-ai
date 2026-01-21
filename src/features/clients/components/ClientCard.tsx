import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import type { Client } from '../types';
import { UNASSIGNED_CLIENT_ID } from '../types';

/**
 * Props for ClientCard component
 */
interface ClientCardProps {
  client: Client;
  // eslint-disable-next-line no-unused-vars
  onPress?: (client: Client) => void;
}

/**
 * ClientCard Component
 *
 * Professional client card following FAANG-level design standards:
 * - 48x48pt icon container with person icon
 * - Name with special badge for unassigned clients
 * - Phone and location with icons
 * - Chevron indicator for tappability
 * - Subtle shadow and consistent spacing
 */
export function ClientCard({ client, onPress }: ClientCardProps) {
  const isUnassigned = client.id === UNASSIGNED_CLIENT_ID;

  return (
    <Card onPress={onPress ? () => onPress(client) : undefined} style={styles.card}>
      <View style={styles.container}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header with name and badge */}
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {client.name}
            </Text>
            {isUnassigned && (
              <Badge variant="warning" style={styles.badge}>
                Special
              </Badge>
            )}
          </View>

          {/* Phone with icon */}
          <View style={styles.detailRow}>
            <Ionicons
              name="call"
              size={14}
              color={colors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {client.phone}
            </Text>
          </View>

          {/* Address with icon */}
          <View style={styles.detailRow}>
            <Ionicons
              name="location"
              size={14}
              color={colors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText} numberOfLines={1}>
              {client.city}, {client.state}
            </Text>
          </View>
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
    padding: spacing[3],
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
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    flexShrink: 0,
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
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
