import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState, Button, Spinner } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import { useTodaysJobs, useCreateJob } from '../hooks/useJobs';
import { JobCard } from '../components/JobCard';
import { JobForm } from '../components/JobForm';
import type { JobFormData, Job } from '../types';
import type { RootStackParamList } from '@/navigation/types';
import { useClientList } from '@/features/clients';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * TodaysJobsScreen
 *
 * Main entry screen showing today's scheduled jobs
 * TODO: Add quick actions, job detail navigation
 */
export function TodaysJobsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useTodaysJobs();
  const { data: clientsData } = useClientList();
  const createMutation = useCreateJob();

  const clients = useMemo(() => clientsData?.items || [], [clientsData?.items]);

  const handleAdd = () => {
    setShowForm(true);
  };

  const handleSubmit = async (formData: JobFormData) => {
    await createMutation.mutateAsync(formData);
    setShowForm(false);
  };

  const handleStartDiagnostic = (job: Job) => {
    navigation.navigate('DiagnosticChat', {
      clientId: job.clientId,
      jobId: job.id,
      equipmentId: job.equipmentId,
    });
  };

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    const allJobs = data?.items || [];

    if (!searchQuery.trim()) {
      return allJobs;
    }

    const query = searchQuery.toLowerCase();
    return allJobs.filter((job) => {
      const client = clients.find((c) => c.id === job.clientId);
      const clientName = client?.name.toLowerCase() || '';
      const jobType = job.type.toLowerCase();
      const description = job.description.toLowerCase();

      return clientName.includes(query) || jobType.includes(query) || description.includes(query);
    });
  }, [data?.items, searchQuery, clients]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Spinner message="Loading today's jobs..." />
      </SafeAreaView>
    );
  }

  const jobs = filteredJobs;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {jobs.length === 0 ? (
          <EmptyState
            title="No jobs scheduled for today"
            description="Create a job to get started"
            action={<Button onPress={handleAdd}>Create Job</Button>}
          />
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <JobCard job={item} onStartDiagnostic={handleStartDiagnostic} />
            )}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.header}>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by client, job type, or description..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <Button onPress={handleAdd}>Create Job</Button>
              </View>
            }
          />
        )}
      </View>

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <JobForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
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
  content: {
    flex: 1,
  },
  list: {
    padding: spacing[4],
  },
  header: {
    marginBottom: spacing[4],
  },
  searchContainer: {
    marginBottom: spacing[3],
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
