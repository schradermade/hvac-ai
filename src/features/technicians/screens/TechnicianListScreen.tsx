/**
 * Technician List Screen
 *
 * Professional list view for managing technicians
 * Matches ClientListScreen quality standards
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  Spinner,
  Card,
  SectionHeader,
  FilterPills,
  SearchInput,
  ListCountBadge,
} from '@/components/ui';
import { colors, spacing, typography } from '@/components/ui';
import { useTechnicians } from '../hooks/useTechnicians';
import type { TechnicianStatus } from '../types';
import { TechnicianCard } from '../components/TechnicianCard';
import { useAuth } from '@/providers';
import type { RootStackParamList } from '@/navigation/types';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Technician List Screen
 */
export function TechnicianListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TechnicianStatus>('all');

  // Check if user can manage team (add/edit/delete)
  const canManageTeam = user?.role === 'admin' || user?.role === 'lead_tech';

  // Fetch technicians with filters
  const { data, isLoading, error } = useTechnicians({
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const { data: allTechsData } = useTechnicians();

  const technicians = data?.technicians || [];
  const statusCounts = useMemo(() => {
    const counts = {
      total: 0,
      active: 0,
      inactive: 0,
      on_leave: 0,
    };
    const allTechs = allTechsData?.technicians || [];
    counts.total = allTechs.length;
    allTechs.forEach((tech) => {
      counts[tech.status] += 1;
    });
    return counts;
  }, [allTechsData?.technicians]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {/* Fixed Header */}
        <SectionHeader
          icon="people-outline"
          title="Technicians"
          metadata={{
            icon: 'people-outline',
            text: 'Manage your field team',
          }}
          variant="dark"
          count={technicians.length}
          showCount={false}
        >
          {/* Search Row */}
          <View style={styles.searchRow}>
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search technicians..."
            />
          </View>

          <FilterPills
            items={[
              {
                id: 'all',
                label: 'All Techs',
                active: statusFilter === 'all',
                onPress: () => setStatusFilter('all'),
                count: statusCounts.total,
              },
              {
                id: 'active',
                label: 'Active',
                active: statusFilter === 'active',
                onPress: () => setStatusFilter('active'),
                count: statusCounts.active,
              },
              {
                id: 'on-leave',
                label: 'On Leave',
                active: statusFilter === 'on_leave',
                onPress: () => setStatusFilter('on_leave'),
                count: statusCounts.on_leave,
              },
              {
                id: 'inactive',
                label: 'Inactive',
                active: statusFilter === 'inactive',
                onPress: () => setStatusFilter('inactive'),
                count: statusCounts.inactive,
              },
            ]}
            contentContainerStyle={styles.filterChips}
          />
        </SectionHeader>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
              <ListCountBadge count={technicians.length} style={styles.listCountBadge} />
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
    backgroundColor: colors.primaryLight,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  filterChips: {
    paddingTop: 0,
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
    paddingTop: spacing[12],
    position: 'relative',
  },
  listCountBadge: {
    position: 'absolute',
    right: spacing[4],
    top: spacing[2],
    zIndex: 2,
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
