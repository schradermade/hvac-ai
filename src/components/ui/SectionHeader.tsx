import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { HeroSection } from './HeroSection';
import { borderRadius, colors, spacing, typography } from './tokens';

interface SectionHeaderProps {
  title: string;
  icon: React.ComponentProps<typeof HeroSection>['icon'];
  metadata?: React.ComponentProps<typeof HeroSection>['metadata'];
  variant?: React.ComponentProps<typeof HeroSection>['variant'];
  count?: number;
  showCount?: boolean;
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
  style,
  children,
}: SectionHeaderProps) {
  const isDarkTheme = variant === 'indigo' || variant === 'dark';
  const countBadgeBg = isDarkTheme ? 'rgba(255, 255, 255, 0.3)' : colors.primary + '20';
  const countBadgeTextColor = isDarkTheme ? colors.surface : colors.primary;

  return (
    <View style={[styles.container, style]}>
      <HeroSection icon={icon} title={title} metadata={metadata} variant={variant} />
      {showCount && typeof count === 'number' && (
        <View style={[styles.countBadge, { backgroundColor: countBadgeBg }]}>
          <Text style={[styles.countBadgeText, { color: countBadgeTextColor }]}>{count}</Text>
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
  countBadge: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  countBadgeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});
