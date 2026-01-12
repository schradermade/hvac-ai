import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Modal, TextInput, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, Button, Spinner } from '@/components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '@/components/ui';
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
  const [showSearchModal, setShowSearchModal] = useState(false);
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
                <TouchableOpacity
                  style={styles.quickFindButton}
                  onPress={() => setShowSearchModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickFindIcon}>🔍</Text>
                  <Text style={styles.quickFindText}>Quick Find Client</Text>
                </TouchableOpacity>
                <Button onPress={handleAdd}>Add Client</Button>
              </View>
            }
          />
        )}
      </View>

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

      {/* Quick Find Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
              }}
            >
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Find Client</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          <View style={styles.modalSearchContainer}>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by name, phone, address, or email..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.clientListItem}
                onPress={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                  // TODO: Navigate to client detail when implemented
                }}
                activeOpacity={0.7}
              >
                <View style={styles.clientListItemContent}>
                  <Text style={styles.clientListItemName}>{item.name}</Text>
                  <Text style={styles.clientListItemDetails}>
                    {item.phone} • {item.city}
                  </Text>
                  <Text style={styles.clientListItemAddress}>{item.address}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>
                  {searchQuery ? `No clients match "${searchQuery}"` : 'Start typing to search'}
                </Text>
              </View>
            }
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
  quickFindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.base,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    marginBottom: spacing[3],
    minHeight: 60,
    ...shadows.sm,
  },
  quickFindIcon: {
    fontSize: 24,
    marginRight: spacing[2],
  },
  quickFindText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  modalClose: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    minWidth: 60,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalPlaceholder: {
    width: 60,
  },
  modalSearchContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    backgroundColor: colors.background,
  },
  modalSearchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
  },
  modalListContent: {
    paddingBottom: spacing[4],
  },
  clientListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surface,
    minHeight: 80,
  },
  clientListItemContent: {
    flex: 1,
  },
  clientListItemName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  clientListItemDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  clientListItemAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    marginLeft: spacing[2],
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptySearch: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
