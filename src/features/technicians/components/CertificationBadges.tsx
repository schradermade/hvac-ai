/**
 * Certification Badges Component
 *
 * Displays certification badges with expiration warnings
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import type { Certification } from '../types';

interface CertificationBadgesProps {
  certifications: Certification[];
  maxDisplay?: number;
}

/**
 * Check if certification is expiring soon (within 30 days)
 */
function isExpiringSoon(cert: Certification): boolean {
  if (!cert.expiryDate) return false;

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return cert.expiryDate <= thirtyDaysFromNow;
}

/**
 * Check if certification is expired
 */
function isExpired(cert: Certification): boolean {
  if (!cert.expiryDate) return false;
  return cert.expiryDate < new Date();
}

/**
 * Get badge color based on expiration status
 */
function getBadgeColor(cert: Certification): string {
  if (isExpired(cert)) return colors.error;
  if (isExpiringSoon(cert)) return colors.warning;
  return colors.textSecondary;
}

/**
 * Format certification type for display
 */
function formatCertType(type: string): string {
  const typeMap: Record<string, string> = {
    epa_608: 'EPA 608',
    nate: 'NATE',
    manufacturer: 'Mfg',
    other: 'Other',
  };
  return typeMap[type] || type;
}

/**
 * Format expiry date
 */
function formatExpiry(date: Date): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${month}/${year}`;
}

/**
 * Certification Badges Component
 */
export function CertificationBadges({ certifications, maxDisplay = 3 }: CertificationBadgesProps) {
  if (certifications.length === 0) {
    return null;
  }

  const displayCerts = certifications.slice(0, maxDisplay);
  const remainingCount = certifications.length - maxDisplay;

  return (
    <View style={styles.container}>
      {displayCerts.map((cert, index) => {
        const badgeColor = getBadgeColor(cert);
        const isWarning = isExpiringSoon(cert) || isExpired(cert);

        return (
          <View
            key={index}
            style={[styles.badge, { backgroundColor: badgeColor + '20', borderColor: badgeColor }]}
          >
            <Ionicons
              name={isWarning ? 'warning-outline' : 'ribbon-outline'}
              size={14}
              color={badgeColor}
            />
            <Text style={[styles.badgeText, { color: badgeColor }]}>
              {formatCertType(cert.type)}
            </Text>
            {cert.expiryDate && (
              <Text style={[styles.expiryText, { color: badgeColor }]}>
                {formatExpiry(cert.expiryDate)}
              </Text>
            )}
          </View>
        );
      })}

      {remainingCount > 0 && (
        <View style={styles.moreBadge}>
          <Text style={styles.moreText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.base,
    borderWidth: 1,
    gap: spacing[1],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  expiryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  moreBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.base,
    backgroundColor: colors.backgroundDark,
  },
  moreText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
});
