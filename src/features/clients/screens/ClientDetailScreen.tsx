import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spinner, Button, Card, Badge } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useClient } from '../hooks/useClients';
import { useEquipmentByClient, type Equipment } from '@/features/equipment';
import { useJobsByClient, type Job } from '@/features/jobs';
import type { RootStackParamList } from '@/navigation/types';
import { UNASSIGNED_CLIENT_ID } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDetail'>;

/**
 * ClientDetailScreen
 *
 * Professional client detail view with:
 * - Hero section with client name
 * - Contact information with icons
 * - Equipment list with visual indicators
 * - Recent job history with status badges
 * - Quick action buttons
 */
export function ClientDetailScreen({ route, navigation }: Props) {
  const { clientId } = route.params;
  const { data: client, isLoading: loadingClient } = useClient(clientId);
  const { data: equipmentData, isLoading: loadingEquipment } = useEquipmentByClient(clientId);
  const { data: jobsData, isLoading: loadingJobs } = useJobsByClient(clientId);

  const isUnassigned = clientId === UNASSIGNED_CLIENT_ID;
  const equipment = equipmentData?.items || [];
  const jobs = jobsData?.items || [];

  if (loadingClient) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Spinner message="Loading client details..." />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Client not found</Text>
          <Text style={styles.errorHint}>This client may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleStartDiagnostic = () => {
    navigation.navigate('DiagnosticChat', {
      clientId: client.id,
    });
  };

  const handleEquipmentPress = (equipmentId: string) => {
    // TODO: Navigate to equipment detail when implemented
    console.log('Navigate to equipment:', equipmentId);
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in_progress':
        return colors.primary;
      case 'scheduled':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.clientName}>{client.name}</Text>
            {isUnassigned && (
              <Badge variant="warning" style={styles.specialBadge}>
                Special Account
              </Badge>
            )}
          </View>
        </View>

        {/* Quick Actions - Prominent placement */}
        {!isUnassigned && (
          <View style={styles.quickActionsSection}>
            <Button onPress={handleStartDiagnostic}>Start Diagnostic Session</Button>
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="call-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Primary Phone</Text>
                  <Text style={styles.infoValue}>{client.phone}</Text>
                </View>
              </View>

              {client.secondaryPhone && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="call-outline" size={20} color={colors.textMuted} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Secondary Phone</Text>
                    <Text style={styles.infoValue}>{client.secondaryPhone}</Text>
                  </View>
                </View>
              )}

              {client.email && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="mail-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{client.email}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    {client.address}
                    {'\n'}
                    {client.city}, {client.state} {client.zipCode}
                  </Text>
                </View>
              </View>

              {client.homePurchaseDate && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="home-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Home Purchase Date</Text>
                    <Text style={styles.infoValue}>
                      {new Date(client.homePurchaseDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}

              {client.warrantyInfo && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Warranty Information</Text>
                    <Text style={styles.infoValue}>{client.warrantyInfo}</Text>
                  </View>
                </View>
              )}
            </View>

            {client.serviceNotes && (
              <>
                <View style={styles.divider} />
                <View style={styles.serviceNotesContainer}>
                  <View style={styles.serviceNotesHeader}>
                    <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                    <Text style={styles.serviceNotesTitle}>Service Notes</Text>
                  </View>
                  <Text style={styles.serviceNotesText}>{client.serviceNotes}</Text>
                </View>
              </>
            )}
          </Card>
        </View>

        {/* Equipment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="construct-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Equipment</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{equipment.length}</Text>
            </View>
          </View>

          {loadingEquipment ? (
            <Card style={styles.loadingCard}>
              <Spinner message="Loading equipment..." />
            </Card>
          ) : equipment.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {isUnassigned ? 'No Unassigned Equipment' : 'No Equipment Registered'}
              </Text>
              <Text style={styles.emptyHint}>
                {isUnassigned
                  ? 'All equipment has been assigned'
                  : 'Add equipment to track service history'}
              </Text>
            </Card>
          ) : (
            <View style={styles.cardList}>
              {equipment.map((item: Equipment) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleEquipmentPress(item.id)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.equipmentCard}>
                    <View style={styles.equipmentContainer}>
                      <View style={styles.equipmentIconContainer}>
                        <Ionicons name="cube" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.equipmentContent}>
                        <View style={styles.equipmentHeader}>
                          <Text style={styles.equipmentName}>{item.name}</Text>
                          <Badge variant="neutral" style={styles.systemTypeBadge}>
                            {item.systemType.toUpperCase()}
                          </Badge>
                        </View>
                        {item.manufacturer && (
                          <Text style={styles.equipmentDetail}>
                            {item.manufacturer}
                            {item.modelNumber && ` • ${item.modelNumber}`}
                          </Text>
                        )}
                        {item.serialNumber && (
                          <Text style={styles.equipmentSerial}>S/N: {item.serialNumber}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Jobs Section */}
        {!isUnassigned && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recent Jobs</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{jobs.length}</Text>
              </View>
            </View>

            {loadingJobs ? (
              <Card style={styles.loadingCard}>
                <Spinner message="Loading jobs..." />
              </Card>
            ) : jobs.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="calendar-clear-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Jobs Scheduled</Text>
                <Text style={styles.emptyHint}>
                  Schedule a job to start tracking service history
                </Text>
              </Card>
            ) : (
              <View style={styles.cardList}>
                {jobs.slice(0, 5).map((job: Job) => (
                  <Card key={job.id} style={styles.jobCard}>
                    <View style={styles.jobContainer}>
                      <View style={styles.jobIconContainer}>
                        <Ionicons name="briefcase" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.jobContent}>
                        <View style={styles.jobHeader}>
                          <Text style={styles.jobType}>{job.type.toUpperCase()}</Text>
                          <View
                            style={[
                              styles.jobStatusBadge,
                              { backgroundColor: getJobStatusColor(job.status) + '20' },
                            ]}
                          >
                            <View
                              style={[
                                styles.jobStatusDot,
                                { backgroundColor: getJobStatusColor(job.status) },
                              ]}
                            />
                            <Text
                              style={[
                                styles.jobStatusText,
                                { color: getJobStatusColor(job.status) },
                              ]}
                            >
                              {job.status.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.jobMeta}>
                          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                          <Text style={styles.jobDate}>
                            {new Date(job.scheduledStart).toLocaleDateString()} at{' '}
                            {new Date(job.scheduledStart).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <Text style={styles.jobDescription} numberOfLines={2}>
                          {job.description}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
                {jobs.length > 5 && (
                  <TouchableOpacity style={styles.viewAllButton} activeOpacity={0.7}>
                    <Text style={styles.viewAllText}>View All Jobs</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Bottom spacing for scroll */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  heroSection: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  clientName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  specialBadge: {
    marginLeft: spacing[2],
  },
  quickActionsSection: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    minWidth: 32,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  infoCard: {
    marginHorizontal: spacing[4],
    padding: spacing[5],
  },
  infoGrid: {
    gap: spacing[4],
  },
  infoItem: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[4],
  },
  serviceNotesContainer: {
    gap: spacing[2],
  },
  serviceNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  serviceNotesTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceNotesText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  cardList: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  loadingCard: {
    marginHorizontal: spacing[4],
    padding: spacing[6],
    alignItems: 'center',
  },
  emptyCard: {
    marginHorizontal: spacing[4],
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  emptyHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  equipmentCard: {
    padding: spacing[4],
    ...shadows.sm,
  },
  equipmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  equipmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.base,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentContent: {
    flex: 1,
    gap: spacing[1],
  },
  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  equipmentName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  systemTypeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  equipmentDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  equipmentSerial: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  jobCard: {
    padding: spacing[4],
    ...shadows.sm,
  },
  jobContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  jobIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.base,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobContent: {
    flex: 1,
    gap: spacing[2],
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  jobStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.base,
  },
  jobStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  jobStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  jobDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  jobDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  viewAllText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  bottomSpacer: {
    height: spacing[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
    gap: spacing[3],
  },
  errorText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
