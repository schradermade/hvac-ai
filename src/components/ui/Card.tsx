import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from './tokens';

/**
 * Props for Card component
 */
interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Make card pressable */
  onPress?: () => void;
  /** Custom style */
  style?: ViewStyle;
  /** Remove padding */
  noPadding?: boolean;
  /** Remove shadow */
  noShadow?: boolean;
}

/**
 * Card Component
 *
 * Container for discrete content following design principles:
 * - Subtle shadow for elevation
 * - Consistent border radius
 * - Optional pressable state
 * - Clean, minimal design
 *
 * @example
 * <Card>
 *   <Text>Card content here</Text>
 * </Card>
 *
 * <Card onPress={handlePress}>
 *   <Text>Tappable card</Text>
 * </Card>
 */
export function Card({ children, onPress, style, noPadding = false, noShadow = false }: CardProps) {
  const content = (
    <View style={[styles.card, !noPadding && styles.cardPadding, !noShadow && shadows.base, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    marginBottom: spacing[3],
  },
  cardPadding: {
    padding: spacing[4],
  },
  pressed: {
    opacity: 0.7,
  },
});
