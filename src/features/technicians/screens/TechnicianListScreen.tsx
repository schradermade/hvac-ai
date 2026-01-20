/**
 * Technician List Screen
 *
 * Professional list view for managing technicians
 * Matches ClientListScreen quality standards
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Spinner, Card, HeroSection, FilterPills } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/components/ui';
import { useTechnicians } from '../hooks/useTechnicians';
import { TechnicianCard } from '../components/TechnicianCard';
import { useAuth } from '@/providers';
import type { RootStackParamList } from '@/navigation/types';
import type { TechnicianStatus } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterOption = 'all' | TechnicianStatus;

/**
 * Technician List Screen
 */
export function TechnicianListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');
  const [labelWidth, setLabelWidth] = useState(0);

  // Check if user can manage team (add/edit/delete)
  const canManageTeam = user?.role === 'admin' || user?.role === 'lead_tech';

  // Fetch technicians with filters
  const { data, isLoading, error } = useTechnicians({
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const technicians = data?.technicians || [];
  const statusCounts = {
    all: technicians.length,
    active: technicians.filter((t) => t.status === 'active').length,
    inactive: technicians.filter((t) => t.status === 'inactive').length,
    on_leave: technicians.filter((t) => t.status === 'on_leave').length,
  } as const;
  const statusLabels: Record<FilterOption, string> = {
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    on_leave: 'On Leave',
  };
  const longestLabel = Object.values(statusLabels).reduce((longest, label) =>
    label.length > longest.length ? label : longest
  );
  const selectedCount = statusCounts[statusFilter];
  const selectedLabel = statusLabels[statusFilter];
  const handleLabelMeasure = (width: number) => {
    setLabelWidth((prev) => (width > prev ? width : prev));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {/* Fixed Header */}
        <View style={styles.fixedHeader}>
          <HeroSection
            icon="people-outline"
            title="Technicians"
            count={technicians.length}
            variant="dark"
          />
          <Text
            style={styles.activeBadgeMeasure}
            onLayout={(event) => handleLabelMeasure(event.nativeEvent.layout.width)}
          >
            {longestLabel}
          </Text>
          <View style={styles.activeBadge}>
            <View style={styles.activeBadgePill}>
              <Text style={styles.activeBadgePillText}>{selectedCount}</Text>
            </View>
            <View
              style={[
                styles.activeBadgeLabelContainer,
                labelWidth ? { width: labelWidth + spacing[2] } : null,
              ]}
            >
              <Text style={styles.activeBadgeText} numberOfLines={1} ellipsizeMode="clip">
                {selectedLabel}
              </Text>
            </View>
          </View>

          {/* Search and Filter */}
          <View style={styles.searchSection}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search technicians..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
          <FilterPills
            items={[
              {
                id: 'all',
                label: 'All',
                active: statusFilter === 'all',
                onPress: () => setStatusFilter('all'),
              },
              {
                id: 'active',
                label: 'Active',
                active: statusFilter === 'active',
                onPress: () => setStatusFilter('active'),
              },
              {
                id: 'inactive',
                label: 'Inactive',
                active: statusFilter === 'inactive',
                onPress: () => setStatusFilter('inactive'),
              },
              {
                id: 'on_leave',
                label: 'On Leave',
                active: statusFilter === 'on_leave',
                onPress: () => setStatusFilter('on_leave'),
              },
            ]}
            contentContainerStyle={styles.filterChips}
          />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Loading State */}
          {isLoading && (
            <View style={styles.centerContainer}>
              <Spinner />
            </View>
          )}

          {/* Error State */}
          {error && (
            <Card style={styles.errorCard}>
              <Ionicons name="alert-circle" size={48} color={colors.error} />
              <Text style={styles.errorTitle}>Failed to Load Technicians</Text>
              <Text style={styles.errorMessage}>
                {error instanceof Error ? error.message : 'Unknown error'}
              </Text>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && technicians.length === 0 && (
            <Card style={styles.emptyCard}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Technicians Found</Text>
              <Text style={styles.emptyHint}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add technicians to manage your team'}
              </Text>
            </Card>
          )}

          {/* Technician List */}
          {!isLoading && !error && technicians.length > 0 && (
            <View style={styles.listContainer}>
              {technicians.map((technician) => (
                <TechnicianCard
                  key={technician.id}
                  technician={technician}
                  onPress={(tech) =>
                    navigation.navigate('TechnicianDetail', {
                      technicianId: tech.id,
                    })
                  }
                />
              ))}
            </View>
          )}

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      {/* Floating Action Button - Only for admins/lead_techs */}
      {canManageTeam && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateTechnician')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fixedHeader: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.primaryPressed,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryPressed,
    gap: spacing[3],
    position: 'relative',
  },
  activeBadge: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  activeBadgeMeasure: {
    position: 'absolute',
    opacity: 0,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    left: -9999,
    top: -9999,
  },
  activeBadgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgePillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  activeBadgeLabelContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  activeBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  searchSection: {
    paddingBottom: spacing[2],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    marginBottom: spacing[3],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  clearButton: {
    padding: spacing[1],
  },
  filterChips: {
    paddingTop: spacing[2],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  errorCard: {
    margin: spacing[4],
    padding: spacing[6],
    alignItems: 'center',
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
  emptyCard: {
    margin: spacing[4],
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
  listContainer: {
    paddingHorizontal: spacing[4],
  },
  bottomSpacer: {
    height: spacing[8],
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
});
