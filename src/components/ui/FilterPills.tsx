/**
 * FilterPills
 *
 * Reusable pill filter row with optional count badges.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from './tokens';

export interface FilterPillItem {
  id: string;
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
  labelStyle?: TextStyle;
  accessory?: React.ReactNode;
}

interface FilterPillsProps {
  items: FilterPillItem[];
  contentContainerStyle?: ViewStyle;
}

export function FilterPills({ items, contentContainerStyle }: FilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, contentContainerStyle]}
    >
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.chip, item.active && styles.chipActive]}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, item.active && styles.chipTextActive, item.labelStyle]}>
            {item.label}
          </Text>
          {item.accessory}
          {typeof item.count === 'number' && item.count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.count}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    gap: spacing[2],
  },
  chipActive: {
    borderWidth: 3,
    borderColor: colors.surface,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.surface,
  },
  chipTextActive: {
    color: colors.surface,
  },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
