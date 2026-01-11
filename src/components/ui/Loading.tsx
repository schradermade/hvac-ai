import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors, spacing, typography } from './tokens';

/**
 * Props for Spinner component
 */
interface SpinnerProps {
  /** Loading message */
  message?: string;
  /** Size of spinner */
  size?: 'small' | 'large';
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Spinner Component
 *
 * Loading indicator following design principles:
 * - Optional message for context
 * - Centered by default
 * - Accessible loading state
 *
 * @example
 * <Spinner />
 * <Spinner message="Loading diagnostics..." />
 */
export function Spinner({ message, size = 'large', style }: SpinnerProps) {
  return (
    <View style={[styles.spinnerContainer, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={styles.spinnerMessage}>{message}</Text>}
    </View>
  );
}

/**
 * Props for EmptyState component
 */
interface EmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button */
  action?: React.ReactNode;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * EmptyState Component
 *
 * Helpful empty state following design principles:
 * - Explains why it's empty
 * - Shows how to add content
 * - Optional call-to-action
 *
 * @example
 * <EmptyState
 *   title="No diagnostics yet"
 *   description="Tap the + button to create your first diagnostic"
 * />
 *
 * <EmptyState
 *   title="No results found"
 *   description="Try adjusting your filters"
 *   action={<Button onPress={clearFilters}>Clear Filters</Button>}
 * />
 */
export function EmptyState({ title, description, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.emptyContainer, style]}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDescription}>{description}</Text>}
      {action && <View style={styles.emptyAction}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  // Spinner Styles
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  spinnerMessage: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    maxWidth: 300,
  },
  emptyAction: {
    marginTop: spacing[6],
  },
});
