import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { HeroSection } from './HeroSection';
import { borderRadius, colors, spacing, typography, shadows } from './tokens';

interface SectionHeaderProps {
  title: string;
  icon: React.ComponentProps<typeof HeroSection>['icon'];
  metadata?: React.ComponentProps<typeof HeroSection>['metadata'];
  variant?: React.ComponentProps<typeof HeroSection>['variant'];
  count?: number;
  showCount?: boolean;
  rightAccessory?: React.ReactNode;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function SectionHeader({
  title,
  icon,
  metadata,
  variant = 'default',
  count,
  showCount = true,
  rightAccessory,
  style,
  children,
}: SectionHeaderProps) {
  const isDarkTheme = variant === 'indigo' || variant === 'dark';
  const countBadgeBg = isDarkTheme ? '#245A4E' : '#CFE6DE';
  const countBadgeTextColor = isDarkTheme ? colors.surface : colors.primary;
  const showOverlay = rightAccessory || (showCount && typeof count === 'number');

  return (
    <View style={[styles.container, style]}>
      <HeroSection icon={icon} title={title} metadata={metadata} variant={variant} />
      {showOverlay && (
        <View style={[styles.countOverlay, { backgroundColor: countBadgeBg }]}>
          {rightAccessory}
          {showCount && typeof count === 'number' && (
            <Text style={[styles.countBadgeText, { color: countBadgeTextColor }]}>{count}</Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.primaryPressed,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryPressed,
    gap: spacing[3],
    paddingTop: spacing[4],
    position: 'relative',
  },
  countOverlay: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    minWidth: 128,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.surface,
    zIndex: 2,
    elevation: 2,
    ...shadows.sm,
  },
  countBadgeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});
