import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from './tokens';

export interface HeroSectionProps {
  /** Icon name for the title */
  icon: keyof typeof Ionicons.glyphMap;
  /** Main title text */
  title: string;
  /** Count to display in badge */
  count: number;
  /** Whether to show count badge */
  showCount?: boolean;
  /** Position of count badge */
  countPlacement?: 'inline' | 'bottomRight';
  /** Optional metadata with icon and text */
  metadata?: {
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
  };
  /** Theme variant - 'default' uses primary color, 'indigo' uses white text on indigo, 'dark' uses white text for dark backgrounds */
  variant?: 'default' | 'indigo' | 'dark';
}

/**
 * HeroSection Component
 *
 * Reusable hero section for list screens with consistent branding.
 * Features:
 * - Icon + Title + Count badge
 * - Optional metadata row
 * - Brand header (HVACOps logo)
 * - Support for default, indigo, and dark themes
 *
 * @example
 * <HeroSection
 *   icon="calendar"
 *   title="Today's Schedule"
 *   count={5}
 *   metadata={{
 *     icon: "time-outline",
 *     text: "Monday, January 13, 2025"
 *   }}
 * />
 */
export function HeroSection({
  icon,
  title,
  count,
  metadata,
  showCount = true,
  countPlacement = 'inline',
  variant = 'default',
}: HeroSectionProps) {
  const isDarkTheme = variant === 'indigo' || variant === 'dark';
  const iconColor = isDarkTheme ? '#FFFFFF' : colors.primary;
  const titleColor = isDarkTheme ? '#FFFFFF' : colors.textPrimary;
  const metaColor = isDarkTheme ? '#FFFFFF' : colors.textSecondary;
  const countBadgeBg = isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : colors.primary + '20';
  const countBadgeTextColor = isDarkTheme ? '#FFFFFF' : colors.primary;
  const brandColor = isDarkTheme ? '#FFFFFF' : colors.primary;

  return (
    <View style={styles.heroSection}>
      <View style={styles.heroContent}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={28} color={iconColor} />
          <Text style={[styles.heroTitle, { color: titleColor }]}>{title}</Text>
          {showCount && countPlacement === 'inline' && (
            <View style={[styles.countBadge, { backgroundColor: countBadgeBg }]}>
              <Text style={[styles.countBadgeText, { color: countBadgeTextColor }]}>{count}</Text>
            </View>
          )}
        </View>

        {/* Optional Metadata Row */}
        {metadata && (
          <View style={styles.metaRow}>
            <Ionicons name={metadata.icon} size={16} color={metaColor} />
            <Text style={[styles.metaText, { color: metaColor }]}>{metadata.text}</Text>
          </View>
        )}
      </View>

      {/* Brand Header - Top Right */}
      <View style={styles.brandHeader}>
        <View style={styles.brandLogoContainer}>
          <Ionicons name="snow" size={20} color={brandColor} />
        </View>
        <Text style={[styles.brandText, { color: isDarkTheme ? '#FFFFFF' : colors.textPrimary }]}>
          HVACOps
        </Text>
      </View>

      {showCount && countPlacement === 'bottomRight' && (
        <View style={[styles.countBadge, styles.countBadgeBottom, { backgroundColor: countBadgeBg }]}>
          <Text style={[styles.countBadgeText, { color: countBadgeTextColor }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
    position: 'relative',
  },
  heroContent: {
    flex: 1,
    gap: spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  countBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  countBadgeBottom: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  brandLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
});
