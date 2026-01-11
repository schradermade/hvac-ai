import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography, touchTarget } from './tokens';

/**
 * Button variants
 */
type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

/**
 * Button sizes
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for Button component
 */
interface ButtonProps {
  /** Button text label */
  children: string;
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Loading state shows spinner */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Custom style override */
  style?: ViewStyle;
  /** Press handler */
  onPress?: () => void;
}

/**
 * Button Component
 *
 * Professional, accessible button following design principles:
 * - Clear visual hierarchy with variants
 * - Minimum 44pt touch target
 * - Loading and disabled states
 * - Haptic feedback ready
 *
 * @example
 * <Button onPress={handleSave}>Save</Button>
 * <Button variant="destructive" onPress={handleDelete}>Delete</Button>
 * <Button variant="ghost" size="sm">Cancel</Button>
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  onPress,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Get size-specific styles
  const sizeStyle = size === 'sm' ? styles.sizeSM : size === 'lg' ? styles.sizeLG : styles.sizeMD;

  // Get variant-specific styles
  const variantBaseStyle =
    variant === 'primary'
      ? styles.primaryBase
      : variant === 'secondary'
        ? styles.secondaryBase
        : variant === 'destructive'
          ? styles.destructiveBase
          : styles.ghostBase;

  const variantPressedStyle =
    variant === 'primary'
      ? styles.primaryPressed
      : variant === 'secondary'
        ? styles.secondaryPressed
        : variant === 'destructive'
          ? styles.destructivePressed
          : styles.ghostPressed;

  const variantTextStyle =
    variant === 'primary'
      ? styles.primaryText
      : variant === 'secondary'
        ? styles.secondaryText
        : variant === 'destructive'
          ? styles.destructiveText
          : styles.ghostText;

  const textSizeStyle =
    size === 'sm' ? styles.textSM : size === 'lg' ? styles.textLG : styles.textMD;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantBaseStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && variantPressedStyle,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'destructive' ? colors.surface : colors.primary
          }
        />
      ) : (
        <Text
          style={[styles.text, variantTextStyle, textSizeStyle, isDisabled && styles.textDisabled]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Base Styles
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    minHeight: touchTarget.minHeight,
    minWidth: 80,
    paddingHorizontal: spacing[5],
  },

  // Size Variants
  sizeSM: {
    minHeight: 36,
    paddingHorizontal: spacing[4],
  },
  sizeMD: {
    minHeight: touchTarget.minHeight,
    paddingHorizontal: spacing[5],
  },
  sizeLG: {
    minHeight: 52,
    paddingHorizontal: spacing[6],
  },

  // Full Width
  fullWidth: {
    width: '100%',
  },

  // Primary Variant
  primaryBase: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryText: {
    color: colors.surface,
  },

  // Secondary Variant
  secondaryBase: {
    backgroundColor: colors.backgroundDark,
  },
  secondaryPressed: {
    backgroundColor: colors.borderDark,
  },
  secondaryText: {
    color: colors.textPrimary,
  },

  // Destructive Variant
  destructiveBase: {
    backgroundColor: colors.error,
  },
  destructivePressed: {
    backgroundColor: '#dc2626',
  },
  destructiveText: {
    color: colors.surface,
  },

  // Ghost Variant
  ghostBase: {
    backgroundColor: colors.transparent,
  },
  ghostPressed: {
    backgroundColor: colors.background,
  },
  ghostText: {
    color: colors.primary,
  },

  // Disabled State
  disabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },

  // Text Styles
  text: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  textSM: {
    fontSize: typography.fontSize.sm,
  },
  textMD: {
    fontSize: typography.fontSize.base,
  },
  textLG: {
    fontSize: typography.fontSize.lg,
  },
  textDisabled: {
    color: colors.disabled,
  },
});
