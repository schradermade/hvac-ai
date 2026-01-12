import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, shadows } from '@/components/ui';
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
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.collapsedTextContainer}>
              <Text style={styles.collapsedTitle}>Session Context</Text>
              <Text style={styles.collapsedSubtitle}>
                {client.name}
                {job && ` • ${job.type}`}
                {equipment && ` • ${equipment.name}`}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.8)" />
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
            <Ionicons name="chevron-up" size={20} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.collapseButtonText}>Hide</Text>
          </TouchableOpacity>

          {/* Client Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
              <Text style={styles.sectionLabel}>CLIENT</Text>
            </View>
            <Text style={styles.contextTitle}>{client.name}</Text>
            <View style={styles.detailRow}>
              <Ionicons name="call" size={14} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.detailText}>{client.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={14} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.detailText}>
                {client.address}, {client.city}, {client.state} {client.zipCode}
              </Text>
            </View>
          </View>

          {/* Job Section (if present) */}
          {job && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="briefcase" size={20} color="#FFFFFF" />
                <Text style={styles.sectionLabel}>JOB</Text>
              </View>
              <Text style={styles.contextTitle}>{job.type.toUpperCase()}</Text>
              <View style={styles.detailRow}>
                <Ionicons name="time" size={14} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.detailText}>
                  {job.scheduledStart.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {job.description && (
                <View style={styles.detailRow}>
                  <Ionicons name="document-text" size={14} color="rgba(255, 255, 255, 0.7)" />
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
                <Ionicons name="cube" size={20} color="#FFFFFF" />
                <Text style={styles.sectionLabel}>EQUIPMENT</Text>
              </View>
              <Text style={styles.contextTitle}>{equipment.name}</Text>
              {equipment.manufacturer && (
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={14} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.detailText}>{equipment.manufacturer}</Text>
                </View>
              )}
              {equipment.modelNumber && (
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag" size={14} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.detailText}>Model: {equipment.modelNumber}</Text>
                </View>
              )}
              {equipment.systemType && (
                <View style={styles.detailRow}>
                  <Ionicons name="settings" size={14} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.detailText}>{equipment.systemType.replace(/_/g, ' ')}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Soft glowing effect at bottom */}
      <View style={styles.glowOverlay}>
        <View style={styles.glowLine100} />
        <View style={styles.glowLine100} />
        <View style={styles.glowLine95} />
        <View style={styles.glowLine90} />
        <View style={styles.glowLine85} />
        <View style={styles.glowLine80} />
        <View style={styles.glowLine75} />
        <View style={styles.glowLine70} />
        <View style={styles.glowLine65} />
        <View style={styles.glowLine60} />
        <View style={styles.glowLine55} />
        <View style={styles.glowLine50} />
        <View style={styles.glowLine45} />
        <View style={styles.glowLine40} />
        <View style={styles.glowLine35} />
        <View style={styles.glowLine30} />
        <View style={styles.glowLine25} />
        <View style={styles.glowLine20} />
        <View style={styles.glowLine16} />
        <View style={styles.glowLine13} />
        <View style={styles.glowLine10} />
        <View style={styles.glowLine08} />
        <View style={styles.glowLine06} />
        <View style={styles.glowLine04} />
        <View style={styles.glowLine02} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#6366F1', // Premium indigo hero
    borderBottomWidth: 0,
    overflow: 'visible',
  },
  glowOverlay: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 10,
  },
  glowLine100: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 1.0,
  },
  glowLine95: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.95,
  },
  glowLine90: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.9,
  },
  glowLine85: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.85,
  },
  glowLine80: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.8,
  },
  glowLine75: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.75,
  },
  glowLine70: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.7,
  },
  glowLine65: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.65,
  },
  glowLine60: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.6,
  },
  glowLine55: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.55,
  },
  glowLine50: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.5,
  },
  glowLine45: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.45,
  },
  glowLine40: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.4,
  },
  glowLine35: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.35,
  },
  glowLine30: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.3,
  },
  glowLine25: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.25,
  },
  glowLine20: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.2,
  },
  glowLine16: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.16,
  },
  glowLine13: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.13,
  },
  glowLine10: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.1,
  },
  glowLine08: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.08,
  },
  glowLine06: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.06,
  },
  glowLine04: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.04,
  },
  glowLine02: {
    height: 1.5,
    backgroundColor: '#6366F1',
    opacity: 0.02,
  },
  // Collapsed state
  collapsedButton: {
    padding: spacing[4],
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...shadows.lg,
  },
  collapsedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedTextContainer: {
    flex: 1,
    gap: spacing[1],
  },
  collapsedTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  collapsedSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
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
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
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
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
  },
  contextTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
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
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
});
