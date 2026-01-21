/**
 * Technician Card Component
 *
 * List item displaying technician information
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { colors, spacing, typography } from '@/components/ui';
import { CertificationBadges } from './CertificationBadges';
import type { Technician } from '../types';

interface TechnicianCardProps {
  technician: Technician;
  // eslint-disable-next-line no-unused-vars
  onPress?: (tech: Technician) => void;
}

/**
 * Get role badge variant
 */
function getRoleVariant(role: string): 'info' | 'neutral' | 'success' {
  switch (role) {
    case 'admin':
      return 'info';
    case 'lead_tech':
      return 'success';
    default:
      return 'neutral';
  }
}

/**
 * Format role for display
 */
function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'Admin',
    lead_tech: 'Lead Tech',
    technician: 'Technician',
    office_staff: 'Office Staff',
  };
  return roleMap[role] || role;
}

/**
 * Technician Card Component
 */
export function TechnicianCard({ technician, onPress }: TechnicianCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(technician);
    }
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        {/* Avatar Container */}
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header with name and role */}
          <View style={styles.header}>
            <Text style={styles.name}>
              {technician.firstName} {technician.lastName}
            </Text>
            <Badge variant={getRoleVariant(technician.role)}>{formatRole(technician.role)}</Badge>
          </View>

          {/* Certifications */}
          {technician.certifications.length > 0 && (
            <View style={styles.certifications}>
              <CertificationBadges certifications={technician.certifications} maxDisplay={2} />
            </View>
          )}

          {/* Phone */}
          <View style={styles.metadata}>
            <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.phone}>{technician.phone}</Text>
          </View>

          {/* Status indicator (if not active) */}
          {technician.status !== 'active' && (
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      technician.status === 'inactive' ? colors.error : colors.warning,
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {technician.status === 'inactive' ? 'Inactive' : 'On Leave'}
              </Text>
            </View>
          )}
        </View>

        {/* Chevron */}
        {onPress && <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />}
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
    padding: spacing[3],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  certifications: {
    marginBottom: spacing[2],
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  phone: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[1],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
