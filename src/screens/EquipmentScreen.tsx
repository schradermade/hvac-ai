import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { EmptyState } from '@/components/ui';
import { colors } from '@/components/ui';
import type { TabScreenProps } from '@/navigation/types';

/**
 * EquipmentScreen
 *
 * Manages saved equipment profiles with:
 * - Quick access to equipment details
 * - Add new equipment
 * - Edit existing equipment
 * - Equipment-specific diagnostic history
 */
// eslint-disable-next-line no-unused-vars
export function EquipmentScreen(_props: TabScreenProps<'Equipment'>) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <EmptyState
          title="No equipment saved yet"
          description="Add equipment profiles to quickly access specs, history, and diagnostics for each unit"
        />
      </View>
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
});
