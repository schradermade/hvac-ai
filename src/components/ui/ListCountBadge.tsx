import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, colors, spacing, typography } from './tokens';

interface ListCountBadgeProps {
  count: number;
  style?: ViewStyle;
}

export function ListCountBadge({ count, style }: ListCountBadgeProps) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
