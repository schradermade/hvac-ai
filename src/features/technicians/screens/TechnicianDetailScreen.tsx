/**
 * Technician Detail Screen
 *
 * Professional detail view matching ClientDetailScreen quality standards
 * Displays full technician information with hero section, certifications, and history
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spinner, Card, Badge } from '@/components/ui';
import { colors, spacing, typography } from '@/components/ui';
import { useTechnician } from '../hooks/useTechnicians';
import type { RootStackParamList } from '@/navigation/types';
import { format } from 'date-fns';

type Props = NativeStackScreenProps<RootStackParamList, 'TechnicianDetail'>;

/**
 * Format role for display
 */
function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'Admin',
    lead_tech: 'Lead Technician',
    technician: 'Technician',
    office_staff: 'Office Staff',
  };
  return roleMap[role] || role;
}

/**
 * Get role badge variant
 */
function getRoleVariant(role: string): 'info' | 'success' | 'neutral' {
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
 * Technician Detail Screen
 */
export function TechnicianDetailScreen({ route }: Props) {
  const { technicianId } = route.params;
  const { data: technician, isLoading, error } = useTechnician(technicianId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <Spinner />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !technician) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Load Technician</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'Technician not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.technicianName}>
            {technician.firstName} {technician.lastName}
          </Text>
          <Badge variant={getRoleVariant(technician.role)}>{formatRole(technician.role)}</Badge>
        </View>

        {/* Contact Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <Card>
            {/* Phone */}
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>PRIMARY PHONE</Text>
                <Text style={styles.infoValue}>{technician.phone}</Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>EMAIL</Text>
                <Text style={styles.infoValue}>{technician.email}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Certifications & Licenses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="ribbon-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Certifications & Licenses</Text>
          </View>

          {technician.certifications.length > 0 ? (
            <Card>
              {technician.certifications.map((cert, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.certificationItem}>
                    <View style={styles.certIconContainer}>
                      <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.certContent}>
                      <Text style={styles.certName}>{cert.name}</Text>
                      {cert.number && <Text style={styles.certDetail}>Number: {cert.number}</Text>}
                      {cert.expiryDate && (
                        <Text style={styles.certDetail}>
                          Expires: {format(cert.expiryDate, 'MMM d, yyyy')}
                        </Text>
                      )}
                      {cert.issuer && (
                        <Text style={styles.certDetail}>Issued by: {cert.issuer}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {/* License Info */}
              {(technician.licenseNumber || technician.licenseExpiry) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.certificationItem}>
                    <View style={styles.certIconContainer}>
                      <Ionicons name="card-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.certContent}>
                      <Text style={styles.certName}>License</Text>
                      {technician.licenseNumber && (
                        <Text style={styles.certDetail}>{technician.licenseNumber}</Text>
                      )}
                      {technician.licenseExpiry && (
                        <Text style={styles.certDetail}>
                          Expires: {format(technician.licenseExpiry, 'MMM d, yyyy')}
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </Card>
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="ribbon-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Certifications on File</Text>
              <Text style={styles.emptyHint}>Add certifications to track credentials</Text>
            </Card>
          )}
        </View>

        {/* Notes Section */}
        {technician.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>

            <Card>
              <Text style={styles.notesText}>{technician.notes}</Text>
            </Card>
          </View>
        )}

        {/* History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>History</Text>
          </View>

          <Card>
            {technician.hireDate && (
              <>
                <View style={styles.historyItem}>
                  <View style={styles.historyIconContainer}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyLabel}>HIRED</Text>
                    <Text style={styles.historyValue}>
                      {format(technician.hireDate, 'MMM d, yyyy')}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <View style={styles.historyItem}>
              <View style={styles.historyIconContainer}>
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyLabel}>CREATED</Text>
                <Text style={styles.historyValue}>
                  {format(technician.createdAt, 'MMM d, yyyy')}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.historyItem}>
              <View style={styles.historyIconContainer}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyLabel}>LAST MODIFIED</Text>
                <Text style={styles.historyValue}>
                  {format(technician.updatedAt, 'MMM d, yyyy')}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
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
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
  },
  technicianName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginLeft: spacing[2],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  certificationItem: {
    flexDirection: 'row',
    padding: spacing[4],
  },
  certIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  certContent: {
    flex: 1,
  },
  certName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  certDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing[4],
  },
  emptyCard: {
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
  },
  notesText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
    padding: spacing[4],
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  historyIconContainer: {
    marginRight: spacing[2],
  },
  historyContent: {
    flex: 1,
  },
  historyLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  historyValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
