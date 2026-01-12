import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Spinner, Button, Card } from '@/components/ui';
import { colors, spacing, typography } from '@/components/ui';
import { useClient } from '../hooks/useClients';
import { useEquipmentByClient, type Equipment } from '@/features/equipment';
import { useJobsByClient, type Job } from '@/features/jobs';
import type { RootStackParamList } from '@/navigation/types';
import { UNASSIGNED_CLIENT_ID } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDetail'>;

/**
 * ClientDetailScreen
 *
 * Shows detailed client information:
 * - Full contact details
 * - Equipment list
 * - Job history
 * - Quick actions (Start Diagnostic)
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
      <SafeAreaView style={styles.container}>
        <Spinner message="Loading client details..." />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Client not found</Text>
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

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Client Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Card style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{client.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{client.phone}</Text>
            </View>
            {client.secondaryPhone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Secondary Phone</Text>
                <Text style={styles.infoValue}>{client.secondaryPhone}</Text>
              </View>
            )}
            {client.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{client.email}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {client.address}
                {'\n'}
                {client.city}, {client.state} {client.zipCode}
              </Text>
            </View>
            {client.homePurchaseDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Home Purchase</Text>
                <Text style={styles.infoValue}>
                  {new Date(client.homePurchaseDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {client.warrantyInfo && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Warranty</Text>
                <Text style={styles.infoValue}>{client.warrantyInfo}</Text>
              </View>
            )}
            {client.serviceNotes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service Notes</Text>
                <Text style={styles.infoValue}>{client.serviceNotes}</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Equipment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Equipment ({equipment.length})</Text>
          </View>
          {loadingEquipment ? (
            <Spinner message="Loading equipment..." />
          ) : equipment.length === 0 ? (
            <Card style={styles.card}>
              <Text style={styles.emptyText}>
                {isUnassigned
                  ? 'No unassigned equipment'
                  : 'No equipment registered for this client'}
              </Text>
            </Card>
          ) : (
            equipment.map((item: Equipment) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleEquipmentPress(item.id)}
                activeOpacity={0.7}
              >
                <Card style={styles.equipmentCard}>
                  <View style={styles.equipmentHeader}>
                    <Text style={styles.equipmentName}>{item.name}</Text>
                    <Text style={styles.equipmentType}>{item.systemType.toUpperCase()}</Text>
                  </View>
                  {item.manufacturer && (
                    <Text style={styles.equipmentDetail}>
                      {item.manufacturer} {item.modelNumber || ''}
                    </Text>
                  )}
                  {item.serialNumber && (
                    <Text style={styles.equipmentDetail}>S/N: {item.serialNumber}</Text>
                  )}
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Jobs Section */}
        {!isUnassigned && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Jobs ({jobs.length})</Text>
            </View>
            {loadingJobs ? (
              <Spinner message="Loading jobs..." />
            ) : jobs.length === 0 ? (
              <Card style={styles.card}>
                <Text style={styles.emptyText}>No jobs scheduled</Text>
              </Card>
            ) : (
              jobs.slice(0, 5).map((job: Job) => (
                <Card key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobType}>{job.type.toUpperCase()}</Text>
                    <Text style={styles.jobStatus}>{job.status}</Text>
                  </View>
                  <Text style={styles.jobDate}>
                    {new Date(job.scheduledStart).toLocaleDateString()} at{' '}
                    {new Date(job.scheduledStart).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.jobDescription}>{job.description}</Text>
                </Card>
              ))
            )}
          </View>
        )}

        {/* Quick Actions */}
        {!isUnassigned && (
          <View style={styles.section}>
            <Button onPress={handleStartDiagnostic}>Start Diagnostic Session</Button>
          </View>
        )}
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
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  card: {
    padding: spacing[4],
  },
  infoRow: {
    marginBottom: spacing[3],
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  equipmentCard: {
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  equipmentName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  equipmentType: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  equipmentDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  jobCard: {
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  jobType: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  jobStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  jobDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  jobDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    textAlign: 'center',
  },
});
