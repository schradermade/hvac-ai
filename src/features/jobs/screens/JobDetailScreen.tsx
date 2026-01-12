import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spinner, Button, Card } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useJob, useUpdateJob } from '../hooks/useJobs';
import { useClient } from '@/features/clients';
import { useEquipment } from '@/features/equipment';
import type { RootStackParamList } from '@/navigation/types';
import type { AppointmentStatus, JobType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

/**
 * JobDetailScreen
 *
 * Professional job detail view following ClientDetailScreen gold standard with:
 * - Hero section with job type and status badge
 * - Quick action buttons for primary workflows
 * - Schedule information with time details
 * - Client and equipment cards (tappable navigation)
 * - Job description and notes
 * - Status update controls
 * - Timestamps and metadata
 */
export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { data: job, isLoading: loadingJob } = useJob(jobId);
  const { data: client, isLoading: loadingClient } = useClient(job?.clientId || '');
  const { data: equipment, isLoading: loadingEquipment } = useEquipment(job?.equipmentId || '');
  const updateJobMutation = useUpdateJob();

  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (loadingJob) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Spinner message="Loading job details..." />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Job not found</Text>
          <Text style={styles.errorHint}>This job may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getJobTypeIcon = (type: JobType): keyof typeof Ionicons.glyphMap => {
    switch (type.toLowerCase()) {
      case 'maintenance':
        return 'construct';
      case 'repair':
        return 'build';
      case 'installation':
        return 'settings';
      case 'inspection':
        return 'search';
      case 'emergency':
        return 'alert-circle';
      default:
        return 'briefcase';
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in_progress':
        return colors.primary;
      case 'scheduled':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      case 'rescheduled':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const handleStartDiagnostic = () => {
    navigation.navigate('DiagnosticChat', {
      clientId: job.clientId,
      jobId: job.id,
      equipmentId: job.equipmentId,
    });
  };

  const handleClientPress = () => {
    if (client) {
      navigation.navigate('ClientDetail', { clientId: client.id });
    }
  };

  const handleEquipmentPress = () => {
    // TODO: Navigate to equipment detail when implemented
    console.log('Navigate to equipment:', job.equipmentId);
  };

  const handleStatusUpdate = async (newStatus: AppointmentStatus) => {
    try {
      setUpdatingStatus(true);
      const updates: { status: AppointmentStatus; actualStart?: Date; actualEnd?: Date } = {
        status: newStatus,
      };

      // Set actualStart when moving to in_progress
      if (newStatus === 'in_progress' && !job.actualStart) {
        updates.actualStart = new Date();
      }

      // Set actualEnd when completing
      if (newStatus === 'completed' && !job.actualEnd) {
        updates.actualEnd = new Date();
      }

      await updateJobMutation.mutateAsync({
        id: job.id,
        data: updates,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update job status. Please try again.');
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDateTime = (date: Date) => {
    return `${formatDate(date)} at ${formatTime(date)}`;
  };

  const statusColor = getStatusColor(job.status);
  const canStartJob = job.status === 'scheduled';
  const canCompleteJob = job.status === 'in_progress';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Ionicons name={getJobTypeIcon(job.type)} size={32} color={colors.primary} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.jobType}>{job.type.toUpperCase()}</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(job.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Button onPress={handleStartDiagnostic} style={styles.primaryAction}>
            Start Diagnostic Session
          </Button>

          {/* Status Update Actions */}
          <View style={styles.statusActions}>
            {canStartJob && (
              <Button
                variant="secondary"
                onPress={() => handleStatusUpdate('in_progress')}
                loading={updatingStatus}
                disabled={updatingStatus}
                style={styles.statusButton}
              >
                Start Job
              </Button>
            )}
            {canCompleteJob && (
              <Button
                variant="secondary"
                onPress={() => handleStatusUpdate('completed')}
                loading={updatingStatus}
                disabled={updatingStatus}
                style={styles.statusButton}
              >
                Complete Job
              </Button>
            )}
          </View>
        </View>

        {/* Schedule Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(job.scheduledStart)}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Scheduled Time</Text>
                  <Text style={styles.infoValue}>
                    {formatTime(job.scheduledStart)} - {formatTime(job.scheduledEnd)}
                  </Text>
                </View>
              </View>

              {job.actualStart && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="play-circle" size={20} color={colors.success} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Actual Start</Text>
                    <Text style={styles.infoValue}>{formatTime(job.actualStart)}</Text>
                  </View>
                </View>
              )}

              {job.actualEnd && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Actual End</Text>
                    <Text style={styles.infoValue}>{formatTime(job.actualEnd)}</Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
        </View>

        {/* Client Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Client</Text>
          </View>

          {loadingClient ? (
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading client...</Text>
            </Card>
          ) : client ? (
            <TouchableOpacity onPress={handleClientPress} activeOpacity={0.7}>
              <Card style={styles.linkCard}>
                <View style={styles.cardContent}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{client.name}</Text>
                    <Text style={styles.cardSubtitle}>
                      {client.address}, {client.city}
                    </Text>
                    <Text style={styles.cardDetail}>{client.phone}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                </View>
              </Card>
            </TouchableOpacity>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Client information unavailable</Text>
            </Card>
          )}
        </View>

        {/* Equipment Section */}
        {job.equipmentId && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <Ionicons name="construct-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Equipment</Text>
            </View>

            {loadingEquipment ? (
              <Card style={styles.loadingCard}>
                <Text style={styles.loadingText}>Loading equipment...</Text>
              </Card>
            ) : equipment ? (
              <TouchableOpacity onPress={handleEquipmentPress} activeOpacity={0.7}>
                <Card style={styles.linkCard}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardIconContainer}>
                      <Ionicons name="cube" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{equipment.name}</Text>
                      {equipment.manufacturer && (
                        <Text style={styles.cardSubtitle}>{equipment.manufacturer}</Text>
                      )}
                      {equipment.modelNumber && (
                        <Text style={styles.cardDetail}>Model: {equipment.modelNumber}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                  </View>
                </Card>
              </TouchableOpacity>
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>Equipment information unavailable</Text>
              </Card>
            )}
          </View>
        )}

        {/* Job Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Job Details</Text>
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.detailsContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{job.description}</Text>
              </View>

              {job.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{job.notes}</Text>
                </View>
              )}
            </View>
          </Card>
        </View>

        {/* Metadata Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Information</Text>
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="add-circle" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Created</Text>
                  <Text style={styles.infoValueSmall}>{formatDateTime(job.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="create" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                  <Text style={styles.infoValueSmall}>{formatDateTime(job.updatedAt)}</Text>
                </View>
              </View>

              {job.externalId && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="link" size={20} color={colors.textMuted} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>External ID</Text>
                    <Text style={styles.infoValueSmall}>{job.externalId}</Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  errorText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  errorHint: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  heroContent: {
    flex: 1,
    gap: spacing[2],
  },
  jobType: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    alignSelf: 'flex-start',
    ...shadows.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  quickActionsSection: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    gap: spacing[3],
  },
  primaryAction: {
    width: '100%',
  },
  statusActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statusButton: {
    flex: 1,
  },
  section: {
    marginTop: spacing[6],
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  infoCard: {
    marginHorizontal: spacing[4],
    padding: spacing[4],
  },
  infoGrid: {
    gap: spacing[4],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.base,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    gap: spacing[1],
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  infoValueSmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  linkCard: {
    marginHorizontal: spacing[4],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: spacing[1],
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  cardDetail: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  loadingCard: {
    marginHorizontal: spacing[4],
    padding: spacing[4],
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyCard: {
    marginHorizontal: spacing[4],
    padding: spacing[4],
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detailsContent: {
    gap: spacing[4],
  },
  detailSection: {
    gap: spacing[2],
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
