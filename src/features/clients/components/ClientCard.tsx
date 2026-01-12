import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, typography } from '@/components/ui';
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
 * Displays client summary in a card with:
 * - Client name
 * - Phone number
 * - Address
 * - Special badge for "Unassigned" client
 */
export function ClientCard({ client, onPress }: ClientCardProps) {
  const isUnassigned = client.id === UNASSIGNED_CLIENT_ID;

  return (
    <Card onPress={onPress ? () => onPress(client) : undefined} style={styles.card}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.name}>{client.name}</Text>
              {isUnassigned && <Badge variant="warning">Special</Badge>}
            </View>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{client.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>
                {client.address}, {client.city}, {client.state} {client.zipCode}
              </Text>
            </View>
          </View>
        </View>

        {onPress && (
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={32} color={colors.textMuted} />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  details: {
    gap: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    width: 80,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing[3],
  },
});
