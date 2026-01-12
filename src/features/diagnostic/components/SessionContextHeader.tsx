import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useClient } from '@/features/clients';
import { useJob } from '@/features/jobs';
import { useEquipment } from '@/features/equipment';

interface SessionContextHeaderProps {
  clientId: string;
  jobId?: string;
  equipmentId?: string;
}

/**
 * SessionContextHeader Component
 *
 * Shows collapsible context information for a diagnostic session:
 * - Client details (name, phone, address)
 * - Job details (type, time)
 * - Equipment details (manufacturer, model, system type)
 *
 * Starts collapsed with a prominent button to expand.
 * When expanded, shows all context with a collapse button.
 */
export function SessionContextHeader({ clientId, jobId, equipmentId }: SessionContextHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: client } = useClient(clientId);
  const { data: job } = useJob(jobId || '');
  const { data: equipment } = useEquipment(equipmentId || '');

  const toggleExpanded = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExpanded(!isExpanded);
  };

  if (!client) return null;

  return (
    <View style={styles.container}>
      {!isExpanded ? (
        // Collapsed: Prominent button
        <TouchableOpacity
          style={styles.collapsedButton}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <View style={styles.collapsedContent}>
            <View style={styles.collapsedIconContainer}>
              <Ionicons name="information-circle" size={24} color={colors.primary} />
            </View>
            <View style={styles.collapsedTextContainer}>
              <Text style={styles.collapsedTitle}>Session Context</Text>
              <Text style={styles.collapsedSubtitle}>
                {client.name}
                {job && ` • ${job.type}`}
                {equipment && ` • ${equipment.name}`}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      ) : (
        // Expanded: Full context details
        <View style={styles.expandedContainer}>
          {/* Collapse button */}
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={toggleExpanded}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-up" size={20} color={colors.textMuted} />
            <Text style={styles.collapseButtonText}>Hide</Text>
          </TouchableOpacity>

          {/* Client Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={styles.sectionLabel}>CLIENT</Text>
            </View>
            <Text style={styles.contextTitle}>{client.name}</Text>
            <View style={styles.detailRow}>
              <Ionicons name="call" size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>{client.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {client.address}, {client.city}, {client.state} {client.zipCode}
              </Text>
            </View>
          </View>

          {/* Job Section (if present) */}
          {job && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="briefcase" size={20} color={colors.primary} />
                <Text style={styles.sectionLabel}>JOB</Text>
              </View>
              <Text style={styles.contextTitle}>{job.type.toUpperCase()}</Text>
              <View style={styles.detailRow}>
                <Ionicons name="time" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                  {job.scheduledStart.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {job.description && (
                <View style={styles.detailRow}>
                  <Ionicons name="document-text" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText} numberOfLines={2}>
                    {job.description}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Equipment Section (if present) */}
          {equipment && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cube" size={20} color={colors.primary} />
                <Text style={styles.sectionLabel}>EQUIPMENT</Text>
              </View>
              <Text style={styles.contextTitle}>{equipment.name}</Text>
              {equipment.manufacturer && (
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{equipment.manufacturer}</Text>
                </View>
              )}
              {equipment.modelNumber && (
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>Model: {equipment.modelNumber}</Text>
                </View>
              )}
              {equipment.systemType && (
                <View style={styles.detailRow}>
                  <Ionicons name="settings" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{equipment.systemType.replace(/_/g, ' ')}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // Collapsed state
  collapsedButton: {
    padding: spacing[4],
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    padding: spacing[3],
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  collapsedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedTextContainer: {
    flex: 1,
    gap: spacing[1],
  },
  collapsedTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  collapsedSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Expanded state
  expandedContainer: {
    padding: spacing[4],
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    marginBottom: spacing[3],
  },
  collapseButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
  },
  section: {
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  contextTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  detailText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
