import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, Button, Spinner } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
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
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useClientList();
  const createMutation = useCreateClient();

  const handleAdd = () => {
    setShowForm(true);
  };

  const handleSubmit = async (formData: ClientFormData) => {
    await createMutation.mutateAsync(formData);
    setShowForm(false);
  };

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    const allClients = data?.items || [];

    if (!searchQuery.trim()) {
      return allClients;
    }

    const query = searchQuery.toLowerCase();
    return allClients.filter((client) => {
      const name = client.name.toLowerCase();
      const phone = client.phone.toLowerCase();
      const address = client.address.toLowerCase();
      const city = client.city.toLowerCase();
      const email = client.email?.toLowerCase() || '';

      return (
        name.includes(query) ||
        phone.includes(query) ||
        address.includes(query) ||
        city.includes(query) ||
        email.includes(query)
      );
    });
  }, [data?.items, searchQuery]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Spinner message="Loading clients..." />
      </SafeAreaView>
    );
  }

  const clients = filteredClients;

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
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, phone, address, or email..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
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
    backgroundColor: colors.background,
  },
});
