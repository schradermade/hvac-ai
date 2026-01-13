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
  /** Optional metadata with icon and text */
  metadata?: {
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
  };
  /** Theme variant - 'default' uses primary color, 'indigo' uses white text on indigo */
  variant?: 'default' | 'indigo';
}

/**
 * HeroSection Component
 *
 * Reusable hero section for list screens with consistent branding.
 * Features:
 * - Icon + Title + Count badge
 * - Optional metadata row
 * - Brand header (HVACOps logo)
 * - Support for default and indigo themes
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
  variant = 'default',
}: HeroSectionProps) {
  const isIndigo = variant === 'indigo';
  const iconColor = isIndigo ? '#FFFFFF' : colors.primary;
  const titleColor = isIndigo ? '#FFFFFF' : colors.textPrimary;
  const metaColor = isIndigo ? '#FFFFFF' : colors.textSecondary;
  const countBadgeBg = isIndigo ? 'rgba(255, 255, 255, 0.2)' : colors.primary + '20';
  const countBadgeTextColor = isIndigo ? '#FFFFFF' : colors.primary;
  const brandColor = isIndigo ? '#FFFFFF' : colors.primary;

  return (
    <View style={styles.heroSection}>
      <View style={styles.heroContent}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={28} color={iconColor} />
          <Text style={[styles.heroTitle, { color: titleColor }]}>{title}</Text>
          <View style={[styles.countBadge, { backgroundColor: countBadgeBg }]}>
            <Text style={[styles.countBadgeText, { color: countBadgeTextColor }]}>{count}</Text>
          </View>
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
        <Text style={[styles.brandText, { color: isIndigo ? '#FFFFFF' : colors.textPrimary }]}>
          HVACOps
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
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
