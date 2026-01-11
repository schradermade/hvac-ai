import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { TextProps } from 'react-native';
import { colors, typography } from './tokens';

/**
 * Heading levels
 */
type HeadingLevel = 1 | 2 | 3;

/**
 * Props for Heading component
 */
interface HeadingProps extends TextProps {
  /** Heading level (1 = largest) */
  level?: HeadingLevel;
  /** Text content */
  children: React.ReactNode;
}

/**
 * Heading Component
 *
 * Displays headings with appropriate hierarchy.
 *
 * @example
 * <Heading level={1}>Page Title</Heading>
 * <Heading level={2}>Section Title</Heading>
 */
export function Heading({ level = 1, children, style, ...props }: HeadingProps) {
  // Map heading styles based on level
  const headingStyle = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;

  return (
    <Text {...props} style={[styles.heading, headingStyle, style]} accessibilityRole="header">
      {children}
    </Text>
  );
}

/**
 * Props for Body component
 */
interface BodyProps extends TextProps {
  /** Text content */
  children: React.ReactNode;
  /** Secondary text color */
  secondary?: boolean;
}

/**
 * Body Component
 *
 * Standard body text for paragraphs and content.
 *
 * @example
 * <Body>This is body text</Body>
 * <Body secondary>This is secondary text</Body>
 */
export function Body({ children, secondary = false, style, ...props }: BodyProps) {
  return (
    <Text {...props} style={[styles.body, secondary && styles.bodySecondary, style]}>
      {children}
    </Text>
  );
}

/**
 * Props for Label component
 */
interface LabelProps extends TextProps {
  /** Text content */
  children: React.ReactNode;
}

/**
 * Label Component
 *
 * Used for form labels, metadata, and secondary information.
 *
 * @example
 * <Label>Equipment Model</Label>
 */
export function Label({ children, style, ...props }: LabelProps) {
  return (
    <Text {...props} style={[styles.label, style]}>
      {children}
    </Text>
  );
}

/**
 * Props for Caption component
 */
interface CaptionProps extends TextProps {
  /** Text content */
  children: React.ReactNode;
}

/**
 * Caption Component
 *
 * Smallest text for timestamps, hints, and supplementary info.
 *
 * @example
 * <Caption>Updated 2 hours ago</Caption>
 */
export function Caption({ children, style, ...props }: CaptionProps) {
  return (
    <Text {...props} style={[styles.caption, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  // Heading Styles
  heading: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  h1: {
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
  },
  h2: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.fontSize.xl * typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.base,
  },

  // Body Styles
  body: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    color: colors.textPrimary,
  },
  bodySecondary: {
    color: colors.textSecondary,
  },

  // Label Styles
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },

  // Caption Styles
  caption: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
