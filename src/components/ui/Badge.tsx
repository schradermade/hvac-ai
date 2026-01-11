import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from './tokens';

/**
 * Badge variants for different states
 */
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Props for Badge component
 */
interface BadgeProps {
  /** Badge text */
  children: string;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Badge Component
 *
 * Status indicator following design principles:
 * - Color communicates meaning
 * - Compact and scannable
 * - Uses functional color palette
 *
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="error">Failed</Badge>
 */
export function Badge({ children, variant = 'neutral', style }: BadgeProps) {
  // Get variant-specific styles
  const variantBadgeStyle =
    variant === 'success'
      ? styles.successBadge
      : variant === 'warning'
        ? styles.warningBadge
        : variant === 'error'
          ? styles.errorBadge
          : variant === 'info'
            ? styles.infoBadge
            : styles.neutralBadge;

  const variantTextStyle =
    variant === 'success'
      ? styles.successText
      : variant === 'warning'
        ? styles.warningText
        : variant === 'error'
          ? styles.errorText
          : variant === 'info'
            ? styles.infoText
            : styles.neutralText;

  return (
    <View style={[styles.badge, variantBadgeStyle, style]}>
      <Text style={[styles.text, variantTextStyle]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Success Variant
  successBadge: {
    backgroundColor: colors.successLight,
  },
  successText: {
    color: '#047857', // Darker green for contrast
  },

  // Warning Variant
  warningBadge: {
    backgroundColor: colors.warningLight,
  },
  warningText: {
    color: '#b45309', // Darker amber for contrast
  },

  // Error Variant
  errorBadge: {
    backgroundColor: colors.errorLight,
  },
  errorText: {
    color: '#b91c1c', // Darker red for contrast
  },

  // Info Variant
  infoBadge: {
    backgroundColor: '#dbeafe', // Light blue
  },
  infoText: {
    color: '#1e40af', // Darker blue for contrast
  },

  // Neutral Variant
  neutralBadge: {
    backgroundColor: colors.backgroundDark,
  },
  neutralText: {
    color: colors.textSecondary,
  },
});
