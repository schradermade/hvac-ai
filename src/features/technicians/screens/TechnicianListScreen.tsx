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
import { Spinner, Card } from '@/components/ui';
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

  // Check if user can manage team (add/edit/delete)
  const canManageTeam = user?.role === 'admin' || user?.role === 'lead_tech';

  // Fetch technicians with filters
  const { data, isLoading, error } = useTechnicians({
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const technicians = data?.technicians || [];
  const activeCount = technicians.filter((t) => t.status === 'active').length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section - Always Visible */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <Ionicons name="people-outline" size={32} color={colors.primary} />
            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroTitle}>Technicians</Text>
              {!isLoading && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{technicians.length}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            {activeCount} active technician{activeCount !== 1 ? 's' : ''}
          </Text>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'active' && styles.filterChipActive]}
              onPress={() => setStatusFilter('active')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'active' && styles.filterChipTextActive,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'inactive' && styles.filterChipActive]}
              onPress={() => setStatusFilter('inactive')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'inactive' && styles.filterChipTextActive,
                ]}
              >
                Inactive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'on_leave' && styles.filterChipActive]}
              onPress={() => setStatusFilter('on_leave')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'on_leave' && styles.filterChipTextActive,
                ]}
              >
                On Leave
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

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
              {searchQuery ? 'Try a different search term' : 'Add technicians to manage your team'}
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
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
    backgroundColor: colors.primaryLight,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  heroTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: spacing[3],
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginRight: spacing[3],
  },
  countBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  countBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginLeft: 44, // Icon (32px) + gap (12px)
  },
  searchSection: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
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
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.surface,
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
