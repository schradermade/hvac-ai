import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, colors, spacing, typography } from './tokens';

interface HeroCountBadgeProps {
  count: number;
  variant?: 'default' | 'indigo' | 'dark';
  style?: ViewStyle;
}

export function HeroCountBadge({ count, variant = 'default', style }: HeroCountBadgeProps) {
  const isDarkTheme = variant === 'indigo' || variant === 'dark';
  const backgroundColor = isDarkTheme ? 'rgba(255, 255, 255, 0.3)' : colors.primary + '20';
  const textColor = isDarkTheme ? colors.surface : colors.primary;

  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  text: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});
