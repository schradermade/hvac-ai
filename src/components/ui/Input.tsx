import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import type { ViewStyle, TextInputProps } from 'react-native';
import { colors, spacing, borderRadius, typography } from './tokens';

/**
 * Props for Input component
 */
interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text below input */
  helperText?: string;
  /** Mark field as required */
  required?: boolean;
  /** Custom container style */
  style?: ViewStyle;
}

/**
 * Input Component
 *
 * Professional text input following design principles:
 * - Large touch target (48pt height)
 * - Clear label and validation
 * - Error states with helpful messages
 * - Proper keyboard types
 * - Focus states
 *
 * @example
 * <Input
 *   label="Equipment Model"
 *   placeholder="Enter model number"
 *   value={model}
 *   onChangeText={setModel}
 * />
 *
 * <Input
 *   label="Pressure Reading"
 *   keyboardType="numeric"
 *   error="Pressure must be between 0-500 PSI"
 * />
 */
export function Input({
  label,
  error,
  helperText,
  required,
  style,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Field */}
      <TextInput
        {...textInputProps}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          textInputProps.editable === false && styles.inputDisabled,
        ]}
        placeholderTextColor={colors.disabled}
        onFocus={(e) => {
          setIsFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          textInputProps.onBlur?.(e);
        }}
      />

      {/* Error or Helper Text */}
      {(error || helperText) && (
        <Text style={[styles.helperText, hasError && styles.errorText]}>{error || helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  required: {
    color: colors.error,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.backgroundDark,
    color: colors.disabled,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
  errorText: {
    color: colors.error,
  },
});
