import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { Spinner, Card, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useJob, useJobNotes, useUpdateJob } from '../hooks/useJobs';
import { useClient } from '@/features/clients';
import { useEquipment } from '@/features/equipment';
import { useAuth } from '@/providers';
import { getAuthToken } from '@/lib/storage';
import { AssignJobModal } from '../components/AssignJobModal';
import { JobActionButtons } from '../components/JobActionButtons';
import { JobAssignmentBadge } from '../components/JobAssignmentBadge';
import { jobService } from '../services/jobService';
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
  const { user } = useAuth();
  const { data: job, isLoading: loadingJob } = useJob(jobId);
  const { data: notesData, isLoading: loadingNotes } = useJobNotes(jobId);
  const { data: client, isLoading: loadingClient } = useClient(job?.clientId || '');
  const { data: equipment, isLoading: loadingEquipment } = useEquipment(job?.equipmentId || '');
  const updateJobMutation = useUpdateJob();
  const queryClient = useQueryClient();

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const notes = notesData?.items ?? [];

  useEffect(() => {
    if (!__DEV__) return;
    let cancelled = false;
    const logToken = async () => {
      const token = await getAuthToken();
      if (!cancelled) {
        console.log('[AUTH_BEARER]', token ?? 'null');
      }
    };
    logToken();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

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

  const handleStartCopilot = () => {
    navigation.navigate('JobCopilot', {
      jobId: job.id,
    });
  };

  const handleClientPress = () => {
    if (client) {
      navigation.navigate('ClientDetail', { clientId: client.id });
    }
  };

  const handleEquipmentPress = () => {
    if (job.equipmentId) {
      navigation.navigate('EquipmentDetail', { equipmentId: job.equipmentId });
    }
  };

  const handleStatusUpdate = async (newStatus: AppointmentStatus) => {
    try {
      if (newStatus === 'in_progress' && job.status !== 'accepted') {
        Alert.alert('Cannot start job', 'Job must be accepted by a technician before starting.');
        return;
      }

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

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Note required', 'Please enter a note before saving.');
      return;
    }

    setSavingNote(true);
    try {
      await jobService.addNote(job.id, noteText.trim());
      setNoteText('');
      setNoteModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', job.id, 'notes'] });
      Alert.alert('Note saved', 'Your note has been added to the job.');
    } catch (error) {
      console.error('Failed to save note:', error);
      Alert.alert('Save failed', 'Unable to save the note. Please try again.');
    } finally {
      setSavingNote(false);
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

  // Assignment handlers
  const handleAssignJob = () => {
    setAssignModalVisible(true);
  };

  // Determine user permissions and job state
  const isAdmin = user?.role === 'admin' || user?.role === 'lead_tech';
  const isAssignedToUser = job.assignment?.technicianId === user?.id;
  const canAcceptOrDecline =
    isAssignedToUser && (job.status === 'assigned' || job.status === 'unassigned');

  const statusColor = getStatusColor(job.status);
  const canStartJob = job.status === 'accepted';
  const showStartJob = !['in_progress', 'completed', 'cancelled'].includes(job.status);
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

        {/* Job Status Actions */}
        <View style={styles.quickActionsSection}>
          {showStartJob || canCompleteJob ? (
            <>
              <View style={styles.primaryActionsRow}>
                <View style={styles.actionCell}>
                  {canCompleteJob ? (
                    <TouchableOpacity
                      style={[
                        styles.primaryActionCompactSecondary,
                        updatingStatus && styles.primaryActionDisabled,
                      ]}
                      onPress={() => handleStatusUpdate('completed')}
                      disabled={updatingStatus}
                      activeOpacity={0.8}
                    >
                      {updatingStatus ? (
                        <ActivityIndicator size="small" color={colors.surface} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color={colors.surface} />
                          <Text style={styles.primaryActionTextCompact}>Complete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.primaryActionCompactSecondary,
                        (!canStartJob || updatingStatus) && styles.primaryActionDisabled,
                      ]}
                      onPress={() => handleStatusUpdate('in_progress')}
                      disabled={!canStartJob || updatingStatus}
                      activeOpacity={0.8}
                    >
                      {updatingStatus ? (
                        <ActivityIndicator size="small" color={colors.surface} />
                      ) : (
                        <>
                          <Ionicons name="play-circle" size={18} color={colors.surface} />
                          <Text style={styles.primaryActionTextCompact}>Start Job</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.actionCell}>
                  <TouchableOpacity
                    style={styles.aiHelpButtonCompact}
                    onPress={handleStartCopilot}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                    <Text style={styles.aiHelpButtonTextCompact}>Get AI Help</Text>
                  </TouchableOpacity>
                  <Text style={styles.aiHelpFootnote}>Powered by HVACOps AI</Text>
                </View>
              </View>
              {!canStartJob && showStartJob && (
                <Text style={styles.primaryActionHint}>
                  Assign and accept this job before starting.
                </Text>
              )}
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.aiHelpButtonCompact}
                onPress={handleStartCopilot}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.aiHelpButtonTextCompact}>Get AI Help</Text>
              </TouchableOpacity>
              <Text style={styles.aiHelpFootnote}>Powered by HVACOps AI</Text>
            </>
          )}
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

        {/* Assignment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Assignment</Text>
          </View>

          <Card style={styles.infoCard}>
            {job.assignment ? (
              <View style={styles.assignmentContent}>
                {/* Assignment Info */}
                <View style={styles.assignmentInfo}>
                  <View style={styles.assignmentAvatarContainer}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.assignmentDetails}>
                    <Text style={styles.assignmentName}>{job.assignment.technicianName}</Text>
                    <JobAssignmentBadge status={job.status} />
                    <Text style={styles.assignmentMeta}>
                      Assigned {formatDateTime(job.assignment.assignedAt)}
                    </Text>
                    <Text style={styles.assignmentMeta}>By: {job.assignment.assignedByName}</Text>
                  </View>
                </View>

                {/* Accept/Decline Buttons (only for assigned technician) */}
                {canAcceptOrDecline && (
                  <View style={styles.assignmentActions}>
                    <JobActionButtons job={job} currentUserId={user?.id || ''} />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.unassignedContent}>
                <Ionicons name="person-add-outline" size={48} color={colors.textMuted} />
                <Text style={styles.unassignedTitle}>Unassigned</Text>
                <Text style={styles.unassignedHint}>
                  This job has not been assigned to a technician yet
                </Text>

                {/* Assign Button (only for admins) */}
                {isAdmin && (
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={handleAssignJob}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="person-add" size={20} color={colors.surface} />
                    <Text style={styles.assignButtonText}>Assign Technician</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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

          {/* Pet Warning */}
          {client?.petInfo && (
            <Card style={styles.petWarningCard}>
              <View style={styles.petWarningContent}>
                <View style={styles.petWarningIconContainer}>
                  <Ionicons name="paw" size={24} color={colors.warning} />
                </View>
                <View style={styles.petWarningTextContainer}>
                  <Text style={styles.petWarningTitle}>Pets on Site</Text>
                  <Text style={styles.petWarningText}>{client.petInfo}</Text>
                </View>
              </View>
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
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setNoteModalVisible(true)}
              style={styles.addNoteButton}
            >
              Add Note
            </Button>
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.detailsContent}>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="pulse-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={styles.infoValue}>{getStatusLabel(job.status)}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Job Type</Text>
                    <Text style={styles.infoValue}>{job.type.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="cube-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Equipment</Text>
                    <Text style={styles.infoValue}>
                      {loadingEquipment
                        ? 'Loading equipment...'
                        : equipment?.name || 'Not assigned'}
                    </Text>
                  </View>
                </View>
              </View>

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

        {/* Notes Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Technician Notes</Text>
          </View>

          <Card style={styles.infoCard}>
            {loadingNotes ? (
              <View style={styles.notesLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.notesLoadingText}>Loading notes...</Text>
              </View>
            ) : notes.length === 0 ? (
              <Text style={styles.emptyNotesText}>No notes have been added yet.</Text>
            ) : (
              <View style={styles.notesList}>
                {notes.map((note) => {
                  const authorLabel = note.authorName || note.authorEmail || 'Unknown technician';
                  return (
                    <View key={note.id} style={styles.noteItem}>
                      <View style={styles.noteHeader}>
                        <Text style={styles.noteAuthor}>{authorLabel}</Text>
                        <Text style={styles.noteTimestamp}>{formatDateTime(note.createdAt)}</Text>
                      </View>
                      <Text style={styles.noteContent}>{note.content}</Text>
                    </View>
                  );
                })}
              </View>
            )}
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

      {/* Assignment Modal */}
      <AssignJobModal
        visible={assignModalVisible}
        jobId={job.id}
        onClose={() => setAssignModalVisible(false)}
      />

      <Modal
        visible={noteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <SafeAreaView style={styles.noteModalContainer}>
          <View style={styles.noteModalHeader}>
            <Text style={styles.noteModalTitle}>Add Note</Text>
            <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a technician note..."
            placeholderTextColor={colors.textMuted}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.noteActions}>
            <Button variant="ghost" onPress={() => setNoteModalVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleSaveNote} loading={savingNote}>
              Save Note
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
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
  primaryActionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionCell: {
    flex: 1,
  },
  primaryActionDisabled: {
    opacity: 0.6,
  },
  primaryActionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
  primaryActionCompactSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    minHeight: 54,
    ...shadows.lg,
  },
  primaryActionTextCompact: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  aiHelpButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: '#6366F1',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    minHeight: 54,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.lg,
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  aiHelpButtonTextCompact: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  aiHelpFootnote: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
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
  addNoteButton: {
    marginLeft: 'auto',
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
  petWarningCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  petWarningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  petWarningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petWarningTextContainer: {
    flex: 1,
    gap: spacing[1],
  },
  petWarningTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
  },
  petWarningText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  // Assignment section styles
  assignmentContent: {
    gap: spacing[4],
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  assignmentAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentDetails: {
    flex: 1,
    gap: spacing[2],
  },
  assignmentName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  assignmentMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  assignmentActions: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  unassignedContent: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  unassignedTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  unassignedHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.base,
    gap: spacing[2],
    marginTop: spacing[4],
  },
  assignButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.surface,
  },
  noteModalContainer: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  noteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  noteModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  noteInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 160,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  notesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  notesLoadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  emptyNotesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  notesList: {
    gap: spacing[4],
  },
  noteItem: {
    gap: spacing[2],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  noteAuthor: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  noteTimestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  noteContent: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
