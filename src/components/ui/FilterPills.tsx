/**
 * FilterPills
 *
 * Reusable pill filter row with optional count badges.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from './tokens';

export interface FilterPillItem {
  id: string;
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
  labelStyle?: TextStyle;
  inactiveLabelStyle?: TextStyle;
  activeLabelStyle?: TextStyle;
  inactiveStyle?: ViewStyle;
  activeStyle?: ViewStyle;
  accessory?: React.ReactNode;
}

interface FilterPillsProps {
  items: FilterPillItem[];
  contentContainerStyle?: ViewStyle;
  variant?: 'default' | 'indigo';
}

export function FilterPills({
  items,
  contentContainerStyle,
  variant = 'default',
}: FilterPillsProps) {
  const palette =
    variant === 'indigo'
      ? {
          chipBg: 'rgba(255, 255, 255, 0.15)',
          chipBorder: 'rgba(255, 255, 255, 0.3)',
          text: '#FFFFFF',
          activeBg: 'rgba(255, 255, 255, 0.15)',
          activeBorder: 'rgba(255, 255, 255, 0.3)',
          activeText: '#FFFFFF',
          badgeBg: '#FFFFFF',
          badgeText: '#6366F1',
          outline: '#FFFFFF',
        }
      : {
          chipBg: colors.primary,
          chipBorder: colors.primary,
          text: colors.surface,
          activeBg: colors.primary,
          activeBorder: colors.primary,
          activeText: colors.surface,
          badgeBg: colors.surface,
          badgeText: colors.primary,
          outline: colors.surface,
        };

  return (
    <View style={[styles.container, contentContainerStyle]}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.chip,
            { backgroundColor: palette.chipBg, borderColor: palette.chipBorder },
            item.active && { backgroundColor: palette.activeBg, borderColor: palette.activeBorder },
            item.active ? item.activeStyle : item.inactiveStyle,
          ]}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              { color: palette.text },
              item.active && { color: palette.activeText },
              item.labelStyle,
              item.active ? item.activeLabelStyle : item.inactiveLabelStyle,
            ]}
          >
            {item.label}
          </Text>
          {item.accessory}
          {typeof item.count === 'number' && (
            <View style={[styles.badge, { backgroundColor: palette.badgeBg }]}>
              <Text style={[styles.badgeText, { color: palette.badgeText }]}>{item.count}</Text>
            </View>
          )}
          {item.active && (
            <View
              pointerEvents="none"
              style={[styles.chipActiveOutline, { borderColor: palette.outline }]}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 44,
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    gap: spacing[2],
    position: 'relative',
  },
  chipActiveOutline: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  badge: {
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
