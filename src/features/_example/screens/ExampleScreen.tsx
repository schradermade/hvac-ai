import React, { useState } from 'react';
import { View, FlatList, TextInput, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { ExampleCard } from '../components/ExampleCard';
import { useExampleList, useDeleteExample } from '../hooks/useExample';
import type { Example, ExampleStatus } from '../types';

/**
 * ExampleScreen demonstrates:
 * - Composing screen from smaller components
 * - Using custom hooks for data and logic
 * - Handling loading, error, and empty states
 * - Clean separation: Screen = composition, Hook = logic, Component = UI
 */
export function ExampleScreen() {
  const [statusFilter, setStatusFilter] = useState<ExampleStatus | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  // Use hooks for data
  const { data, isLoading, error, refetch } = useExampleList({
    status: statusFilter,
    search: searchQuery,
  });
  const deleteExample = useDeleteExample();

  // Event handlers
  const handleExamplePress = (example: Example) => {
    // In real app: navigate to detail screen
    // eslint-disable-next-line no-console
    console.log('Example pressed:', example);
  };

  const handleDelete = (id: string) => {
    // In real app: show confirmation dialog
    deleteExample.mutate(id);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Render loading state
  if (isLoading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading examples...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Error loading examples</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      </View>
    );
  }

  // Render empty state
  if (!data || data.items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No examples found</Text>
        <Text style={styles.emptyMessage}>Try adjusting your filters</Text>
      </View>
    );
  }

  // Render content
  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search examples..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Status filters */}
      <View style={styles.filtersContainer}>
        <FilterButton
          label="All"
          active={!statusFilter}
          onPress={() => setStatusFilter(undefined)}
        />
        <FilterButton
          label="Draft"
          active={statusFilter === 'draft'}
          onPress={() => setStatusFilter('draft')}
        />
        <FilterButton
          label="Published"
          active={statusFilter === 'published'}
          onPress={() => setStatusFilter('published')}
        />
        <FilterButton
          label="Archived"
          active={statusFilter === 'archived'}
          onPress={() => setStatusFilter('archived')}
        />
      </View>

      {/* List */}
      <FlatList
        data={data.items}
        renderItem={({ item }) => (
          <ExampleCard example={item} onPress={handleExamplePress} onDelete={handleDelete} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={isLoading}
      />
    </View>
  );
}

/**
 * Filter button component (extracted for reusability)
 */
interface FilterButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterButton({ label, active, onPress }: FilterButtonProps) {
  return (
    <Text style={[styles.filterButton, active && styles.filterButtonActive]} onPress={onPress}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    height: 44,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
});
