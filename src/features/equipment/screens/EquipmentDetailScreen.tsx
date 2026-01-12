import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spinner, Button, Card } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
import { useEquipment } from '../hooks/useEquipment';
import { useClient } from '@/features/clients';
import { useJobList } from '@/features/jobs';
import type { RootStackParamList } from '@/navigation/types';
import type { SystemType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EquipmentDetail'>;

/**
 * EquipmentDetailScreen
 *
 * Professional equipment detail view following ClientDetailScreen/JobDetailScreen gold standard:
 * - Hero section with equipment icon and system type badge
 * - Quick action button for diagnostics
 * - Client card (tappable navigation)
 * - Technical specifications card
 * - Recent jobs/service history
 * - Additional information (notes, install date)
 * - Timestamps and metadata
 */
export function EquipmentDetailScreen({ route, navigation }: Props) {
  const { equipmentId } = route.params;
  const { data: equipment, isLoading: loadingEquipment } = useEquipment(equipmentId);
  const { data: client, isLoading: loadingClient } = useClient(equipment?.clientId || '');

  // Get jobs associated with this equipment
  const { data: jobsData } = useJobList();
  const recentJobs =
    jobsData?.items
      ?.filter((job) => job.equipmentId === equipmentId)
      .sort((a, b) => b.scheduledStart.getTime() - a.scheduledStart.getTime())
      .slice(0, 5) || [];

  if (loadingEquipment) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Spinner message="Loading equipment details..." />
      </SafeAreaView>
    );
  }

  if (!equipment) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Equipment not found</Text>
          <Text style={styles.errorHint}>This equipment may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getSystemTypeLabel = (type: SystemType) => {
    switch (type) {
      case 'split_system':
        return 'Split System';
      case 'package_unit':
        return 'Package Unit';
      case 'heat_pump':
        return 'Heat Pump';
      case 'mini_split':
        return 'Mini Split';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  const getSystemTypeIcon = (type: SystemType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'split_system':
        return 'git-network-outline';
      case 'package_unit':
        return 'cube-outline';
      case 'heat_pump':
        return 'flame-outline';
      case 'mini_split':
        return 'layers-outline';
      case 'other':
        return 'ellipsis-horizontal-circle-outline';
      default:
        return 'construct-outline';
    }
  };

  const handleStartDiagnostic = () => {
    navigation.navigate('DiagnosticChat', {
      clientId: equipment.clientId,
      equipmentId: equipment.id,
    });
  };

  const handleClientPress = () => {
    if (client) {
      navigation.navigate('ClientDetail', { clientId: client.id });
    }
  };

  const handleJobPress = (jobId: string) => {
    navigation.navigate('JobDetail', { jobId });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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
          <View style={styles.heroIconContainer}>
            <Ionicons
              name={getSystemTypeIcon(equipment.systemType)}
              size={32}
              color={colors.primary}
            />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.equipmentName}>{equipment.name}</Text>
            <View style={styles.systemTypeBadge}>
              <Ionicons
                name={getSystemTypeIcon(equipment.systemType)}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.systemTypeText}>{getSystemTypeLabel(equipment.systemType)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Button onPress={handleStartDiagnostic} style={styles.primaryAction}>
            Start Diagnostic Session
          </Button>
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

        {/* Technical Specifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Technical Specifications</Text>
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.infoGrid}>
              {equipment.manufacturer && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="business" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Manufacturer</Text>
                    <Text style={styles.infoValue}>{equipment.manufacturer}</Text>
                  </View>
                </View>
              )}

              {equipment.modelNumber && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="pricetag" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Model Number</Text>
                    <Text style={styles.infoValue}>{equipment.modelNumber}</Text>
                  </View>
                </View>
              )}

              {equipment.serialNumber && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="barcode" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Serial Number</Text>
                    <Text style={styles.infoValue}>{equipment.serialNumber}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons
                    name={getSystemTypeIcon(equipment.systemType)}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>System Type</Text>
                  <Text style={styles.infoValue}>{getSystemTypeLabel(equipment.systemType)}</Text>
                </View>
              </View>

              {equipment.refrigerant && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="water" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Refrigerant</Text>
                    <Text style={styles.infoValue}>{equipment.refrigerant}</Text>
                  </View>
                </View>
              )}

              {equipment.tonnage && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="speedometer" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Tonnage</Text>
                    <Text style={styles.infoValue}>{equipment.tonnage} tons</Text>
                  </View>
                </View>
              )}

              {equipment.location && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{equipment.location}</Text>
                  </View>
                </View>
              )}

              {equipment.installDate && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Install Date</Text>
                    <Text style={styles.infoValue}>{formatDate(equipment.installDate)}</Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
        </View>

        {/* Recent Jobs Section */}
        {recentJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recent Service History</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{recentJobs.length}</Text>
              </View>
            </View>

            {recentJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                onPress={() => handleJobPress(job.id)}
                activeOpacity={0.7}
              >
                <Card style={styles.jobCard}>
                  <View style={styles.jobCardContent}>
                    <View style={styles.jobCardHeader}>
                      <Text style={styles.jobType}>{job.type.toUpperCase()}</Text>
                      <View style={styles.jobStatusBadge}>
                        <View
                          style={[
                            styles.jobStatusDot,
                            { backgroundColor: getJobStatusColor(job.status) },
                          ]}
                        />
                        <Text
                          style={[styles.jobStatusText, { color: getJobStatusColor(job.status) }]}
                        >
                          {job.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.jobDescription} numberOfLines={2}>
                      {job.description}
                    </Text>
                    <View style={styles.jobFooter}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.jobDate}>{formatDate(job.scheduledStart)}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textMuted}
                        style={styles.jobChevron}
                      />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Additional Information Section */}
        {equipment.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>

            <Card style={styles.infoCard}>
              <View style={styles.detailsContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{equipment.notes}</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

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
                  <Text style={styles.infoValueSmall}>{formatDateTime(equipment.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="create" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                  <Text style={styles.infoValueSmall}>{formatDateTime(equipment.updatedAt)}</Text>
                </View>
              </View>
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
  equipmentName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  systemTypeBadge: {
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
  systemTypeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  quickActionsSection: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
  primaryAction: {
    width: '100%',
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
  countBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
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
  jobCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    padding: spacing[4],
  },
  jobCardContent: {
    gap: spacing[2],
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobType: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  jobStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
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
  jobDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  jobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  jobDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  jobChevron: {
    marginLeft: 'auto',
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
