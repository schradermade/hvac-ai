import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card, Badge, Caption } from '@/components/ui';
import { colors, spacing, typography } from '@/components/ui';
import type { Equipment } from '../types';

/**
 * Props for EquipmentCard component
 */
interface EquipmentCardProps {
  equipment: Equipment;
  // eslint-disable-next-line no-unused-vars
  onPress?: (equipment: Equipment) => void;
  // eslint-disable-next-line no-unused-vars
  onDelete?: (id: string) => void;
}

/**
 * EquipmentCard Component
 *
 * Displays equipment summary in a card with:
 * - Equipment name and manufacturer
 * - System type badge
 * - Key specs (model, refrigerant, tonnage)
 * - Tap to view/edit
 * - Delete option
 */
export function EquipmentCard({ equipment, onPress, onDelete }: EquipmentCardProps) {
  const systemTypeLabel = equipment.systemType.replace(/_/g, ' ').toUpperCase();

  return (
    <Card onPress={onPress ? () => onPress(equipment) : undefined} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{equipment.name}</Text>
          {equipment.manufacturer && <Caption>{equipment.manufacturer}</Caption>}
        </View>
        <Badge variant="info">{systemTypeLabel}</Badge>
      </View>

      <View style={styles.details}>
        {equipment.modelNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model:</Text>
            <Text style={styles.detailValue}>{equipment.modelNumber}</Text>
          </View>
        )}
        {equipment.refrigerant && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Refrigerant:</Text>
            <Text style={styles.detailValue}>{equipment.refrigerant}</Text>
          </View>
        )}
        {equipment.tonnage && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tonnage:</Text>
            <Text style={styles.detailValue}>{equipment.tonnage} ton</Text>
          </View>
        )}
        {equipment.location && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{equipment.location}</Text>
          </View>
        )}
      </View>

      {onDelete && (
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
          onPress={() => onDelete(equipment.id)}
          hitSlop={8}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
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
  headerLeft: {
    flex: 1,
    marginRight: spacing[2],
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  details: {
    gap: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    width: 100,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  deleteButton: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteButtonPressed: {
    backgroundColor: colors.background,
  },
  deleteButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
  },
});
