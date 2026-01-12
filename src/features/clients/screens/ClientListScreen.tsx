import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, Button, Spinner } from '@/components/ui';
import { colors, spacing } from '@/components/ui';
import { useClientList, useCreateClient } from '../hooks/useClients';
import { ClientCard } from '../components/ClientCard';
import { ClientForm } from '../components/ClientForm';
import type { ClientFormData } from '../types';

/**
 * ClientListScreen
 *
 * Shows all clients with create functionality
 * TODO: Add search, filters, edit functionality
 */
export function ClientListScreen() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useClientList();
  const createMutation = useCreateClient();

  const handleAdd = () => {
    setShowForm(true);
  };

  const handleSubmit = async (formData: ClientFormData) => {
    await createMutation.mutateAsync(formData);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Spinner message="Loading clients..." />
      </SafeAreaView>
    );
  }

  const clients = data?.items || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {clients.length === 0 ? (
          <EmptyState
            title="No clients yet"
            description="Add your first client to get started"
            action={<Button onPress={handleAdd}>Add Client</Button>}
          />
        ) : (
          <FlatList
            data={clients}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ClientCard client={item} />}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.header}>
                <Button onPress={handleAdd}>Add Client</Button>
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
          <ClientForm
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
