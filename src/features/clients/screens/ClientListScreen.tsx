import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Modal, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, Button, Spinner, SectionHeader, SearchInput, FilterPills } from '@/components/ui';
import { colors, spacing, typography } from '@/components/ui';
import { useClientList, useCreateClient } from '../hooks/useClients';
import { ClientCard } from '../components/ClientCard';
import { ClientForm } from '../components/ClientForm';
import type { ClientFormData, Client } from '../types';
import type { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * ClientListScreen
 *
 * Shows all clients with create functionality
 * TODO: Add search, filters, edit functionality
 */
export function ClientListScreen() {
  const navigation = useNavigation<NavigationProp>();
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

  const handleClientPress = (client: Client) => {
    navigation.navigate('ClientDetail', { clientId: client.id });
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
  const allClients = data?.items || [];
  const hasAnyClients = allClients.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {!hasAnyClients ? (
          <EmptyState
            title="No clients yet"
            description="Add your first client to get started"
            action={<Button onPress={handleAdd}>Add Client</Button>}
          />
        ) : (
          <>
            {/* Professional Header */}
            <SectionHeader
              icon="people"
              title="Clients"
              metadata={{
                icon: 'briefcase-outline',
                text: 'Manage your customer base',
              }}
              variant="dark"
              count={allClients.length}
            >
              {/* Search Row */}
              <View style={styles.searchRow}>
                <SearchInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search clients..."
                />
              </View>
              <FilterPills
                items={[
                  {
                    id: 'all',
                    label: 'All Clients',
                    active: true,
                    onPress: () => {},
                  },
                ]}
                contentContainerStyle={styles.filterChips}
              />
            </SectionHeader>

            {/* Scrollable Client List */}
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ClientCard client={item} onPress={handleClientPress} />}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyResults}>
                  <Text style={styles.emptyResultsText}>No clients match "{searchQuery}"</Text>
                  <Text style={styles.emptyResultsHint}>Try a different search term</Text>
                </View>
              }
            />
          </>
        )}
      </View>

      {/* Floating Action Button */}
      {hasAnyClients && (
        <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Create Client Modal */}
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
    backgroundColor: colors.primaryLight,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  filterChips: {
    paddingTop: spacing[2],
  },
  fab: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[20],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  emptyResults: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emptyResultsHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
